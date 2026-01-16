from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import json
import os
import re
from urllib.parse import urlparse
from predict import predict_with_explain

app = Flask(__name__)
CORS(app)

# -------------------------
# Validations & Normalization
# -------------------------

def normalize_url(url):
    """
    Normalizes the URL by removing protocol and www.
    Example: https://www.google.com/ -> google.com/
    """
    if not url:
        return ""
    
    # Remove protocol
    url = re.sub(r'^https?://', '', url, flags=re.IGNORECASE)
    # Remove www.
    url = re.sub(r'^www\.', '', url, flags=re.IGNORECASE)
    # Remove trailing slash
    if url.endswith('/'):
        url = url[:-1]
        
    return url.lower()

# -------------------------
# Whitelist Loading
# -------------------------

WHITELIST_DOMAINS = set()

def load_whitelist():
    """Loads trusted domains from whitelist.json"""
    global WHITELIST_DOMAINS
    try:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        whitelist_path = os.path.join(base_dir, "whitelist.json")
        
        with open(whitelist_path, 'r') as f:
            data = json.load(f)
            # Normalize all domains in the whitelist for consistent matching
            WHITELIST_DOMAINS = {d.lower() for d in data.get("trusted_domains", [])}
            print(f"Loaded {len(WHITELIST_DOMAINS)} domains into whitelist.")
    except Exception as e:
        print(f"Error loading whitelist: {e}")

# Load whitelist on startup
load_whitelist()

def is_whitelisted(url):
    """Checks if the URL's domain is in the whitelist."""
    normalized = normalize_url(url)
    
    # Check exact match or subdomain match
    # Simple check: extract domain from the incoming URL
    # But wait, normalize_url just strips http/www.
    # We should parse the domain properly for checking against the list.
    
    try:
        # Re-add http to use urlparse if missing, to get netloc reliably
        if not url.startswith(('http://', 'https://')):
            parse_url = 'http://' + url
        else:
            parse_url = url
            
        parsed = urlparse(parse_url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
            
        if domain in WHITELIST_DOMAINS:
            return True
            
        # Check parent domains (e.g. sub.google.com should match google.com)
        # However, the requirement says "checked in whitelist if found then return Legitimate"
        # The whitelist contains domains like "google.com".
        # We should check if the domain ends with any of the whitelisted domains?
        # Or exact match?
        # Let's do exact match + subdomains for safety.
        
        for trusted in WHITELIST_DOMAINS:
            if domain == trusted or domain.endswith('.' + trusted):
                return True
                
    except Exception as e:
        print(f"Whitelist check error: {e}")
        
    return False

# -------------------------
# Routes
# -------------------------

@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict_ui():
    url = request.form.get("url", "").strip()
    if not url:
        return render_template("index.html", error="Please enter a URL")

    # 1. URL Normalization
    # 2. Whitelist Check
    if is_whitelisted(url):
        return render_template("index.html", 
                               url=url, 
                               prediction="Legitimate", 
                               confidence="100.0%",
                               risk_level="Low",
                               features={},
                               shap_values={})

    # 3-6. New Model Flow
    try:
        result = predict_with_explain(url)
        # result keys: url, prediction(PHISHING/SAFE), confidence(float 0-1), risk_level, shap_explanation
        
        # Map values for UI
        pred_label = "Phishing" if result["prediction"] == "PHISHING" else "Legitimate"
        conf_percent = f"{result['confidence']*100:.2f}%"
        
        # UI expects features and shap_values dicts likely? 
        # The new predict_with_explain returns a text explanation in 'shap_explanation'. 
        # But looking at old app.py, it passed 'features' and 'shap_values' dicts to template.
        # Let's try to extract them if possible or pass defaults.
        # predict_with_explain doesn't return raw shap values as dict easily accessable here without modifying it.
        # But it does return 'shap_explanation' text.
        
        return render_template("index.html",
                               url=url,
                               prediction=pred_label,
                               confidence=conf_percent,
                               risk_level=result["risk_level"],
                               explanation=result["shap_explanation"], # Pass text explanation
                               # Passing empty dicts for features/shap if template needs them to avoid crash, 
                               # assume template logic might need adjustment or is robust.
                               features={}, 
                               shap_values={} 
                              )
    except Exception as e:
        print(f"Prediction error: {e}")
        return render_template("index.html", error=f"Error: {e}")

@app.route('/api/predict', methods=['POST'])
def predict_api():
    try:
        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({'error': 'No URL provided'}), 400
        
        url = data['url']
        
        # 1. URL Normalization (internal helper does it, but we keep original for logic)
        # 2. Whitelist Check
        if is_whitelisted(url):
            return jsonify({
                "url": url,
                "prediction": "Legitimate",
                "riskScore": 0,
                "riskReasons": ["Whitelisted trusted domain"],
                "confidence": 100.0,
                "is_whitelisted": True
            })
            
        # 3-6. Feature Extraction -> Model -> Decision -> Response
        # predict_with_explain handles extraction, model, shap
        result = predict_with_explain(url)
        
        # Map new model output to extension's expected format
        # Extension expects: prediction, riskScore (0-100), riskReasons, etc.
        
        # New model returns: 
        # {
        #     "url": url,
        #     "prediction": "PHISHING" / "SAFE",
        #     "confidence": 0.xx,
        #     "risk_level": "High"...,
        #     "shap_explanation": "text..."
        # }
        
        prediction_label = "Phishing" if result["prediction"] == "PHISHING" else "Legitimate"
        
        # Convert confidence 0.0-1.0 to 0-100
        # Note: In the new model code:
        # prediction = "PHISHING" if np.argmax(proba) == 1 else "SAFE"
        # confidence is max(proba).
        # If it is SAFE (class 0), probability of class 0 is high.
        # If we want a Risk Score (probability of Phishing), we need proba[1].
        # But predict_with_explain returns 'confidence' of the *predicted class*.
        
        # Let's adjust riskScore based on prediction.
        if result["prediction"] == "PHISHING":
            risk_score = result["confidence"] * 100
        else:
            # If safe, risk score is (1 - confidence_of_safe) * 100 approx?
            # Or just low.
            risk_score = (1.0 - result["confidence"]) * 100
            
        # Extension expects specific keys
        response = {
            "url": url,
            "prediction": prediction_label,
            "riskScore": round(risk_score, 2),
            "riskReasons": [result["shap_explanation"]] if result["shap_explanation"] else [],
            "features": {}, # Could populate if needed
            "shap_values": {} # Could populate if needed
        }
        
        return jsonify(response)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
