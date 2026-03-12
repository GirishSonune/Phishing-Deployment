from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import sqlite3
import os
import re
from urllib.parse import urlparse
from predict import predict_with_explain
from rules import rule_engine

app = Flask(__name__)
CORS(app)

# -------------------------
# Feature Map for UI
# -------------------------
FEATURE_MAP = {
    'length_url': 'URL Length',
    'length_hostname': 'Hostname Length',
    'ip': 'IP Address in URL',
    'nb_dots': 'Number of Dots',
    'nb_hyphens': 'Number of Hyphens',
    'nb_at': 'Number of @ Symbols',
    'nb_qm': 'Number of ? Symbols',
    'nb_and': 'Number of & Symbols',
    'nb_eq': 'Number of = Symbols',
    'nb_underscore': 'Number of Underscores',
    'nb_slash': 'Number of Slashes',
    'nb_percent': 'Number of Percent Signs',
    'nb_colon': 'Number of Colons',
    'nb_www': 'Contains "www"',
    'nb_com': 'Contains ".com"',
    'nb_dslash': 'Number of // Symbols',
    'https_token': 'HTTPS Token present',
    'ratio_digits_url': 'Ratio of Digits in URL',
    'ratio_digits_host': 'Ratio of Digits in Hostname',
    'punycode': 'Punycode URL',
    'port': 'Non-standard Port',
    'tld_in_path': 'TLD detected in Path',
    'tld_in_subdomain': 'TLD detected in Subdomain',
    'abnormal_subdomain': 'Abnormal Subdomain',
    'nb_subdomains': 'Number of Subdomains',
    'prefix_suffix': 'Prefix/Suffix',
    'random_domain': 'Random Domain Signature',
    'shortening_service': 'URL Shortening Service',
    'path_extension': 'Suspicious File Extension',
    'char_repeat': 'Character Repeats',
    'phish_hints': 'Phishing Hints found'
}

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
# Whitelist DB (whitelist.db)
# -------------------------

# Path to the SQLite whitelist database (same folder as this file)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WHITELIST_DB_PATH = os.path.join(BASE_DIR, "whitelist.db")

# Total number of entries in the DB — used to normalize rank → confidence.
# With ~1 million entries (rank 1 to 1,000,000):
#   rank 1        → 99% confidence  (most trusted)
#   rank 1,000,000 → 75% confidence (least trusted but still whitelisted)
WHITELIST_MAX_RANK = 1_000_000
CONFIDENCE_MAX = 99.0
CONFIDENCE_MIN = 75.0

def rank_to_confidence(rank: int) -> float:
    """
    Maps a whitelist rank (1 = most trusted) to a confidence percentage.
    Output range: 75.0% (lowest rank) to 99.0% (rank 1).
    Formula: confidence = 99 - ((rank - 1) / (MAX_RANK - 1)) * 24
    """
    rank = max(1, min(rank, WHITELIST_MAX_RANK))  # clamp just in case
    confidence = CONFIDENCE_MAX - ((rank - 1) / (WHITELIST_MAX_RANK - 1)) * (CONFIDENCE_MAX - CONFIDENCE_MIN)
    return round(confidence, 2)

def extract_domain(url: str) -> str:
    """Extracts the bare domain (no www, no protocol) from a URL."""
    try:
        if not url.startswith(('http://', 'https://')):
            url = 'http://' + url
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        if domain.startswith('www.'):
            domain = domain[4:]
        return domain
    except Exception:
        return ""

def get_whitelist_entry(url: str):
    """
    Looks up the domain (and its parent domains) in whitelist.db.
    Returns the matching row as a dict with keys 'url' and 'rank',
    or None if not found.

    Lookup order:
      1. Exact domain match          (e.g. maps.google.com)
      2. Parent domain match         (e.g. google.com for maps.google.com)
    The lowest rank (most trusted) match is returned when multiple entries exist.
    """
    domain = extract_domain(url)
    if not domain:
        return None

    # Build list of candidate domains to check: exact + parent domains
    # e.g. "a.b.google.com" → ["a.b.google.com", "b.google.com", "google.com"]
    parts = domain.split('.')
    candidates = ['.'.join(parts[i:]) for i in range(len(parts) - 1)]  # excludes TLD-only
    candidates.insert(0, domain)  # exact match first

    try:
        conn = sqlite3.connect(WHITELIST_DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        placeholders = ','.join('?' for _ in candidates)
        query = f"""
            SELECT url, rank FROM whitelist
            WHERE url IN ({placeholders})
            ORDER BY rank ASC
            LIMIT 1
        """
        cursor.execute(query, candidates)
        row = cursor.fetchone()
        conn.close()

        if row:
            return {"url": row["url"], "rank": row["rank"]}
    except Exception as e:
        print(f"Whitelist DB lookup error: {e}")

    return None

def is_whitelisted(url: str):
    """
    Returns (True, rank) if the URL is in the whitelist, else (False, None).
    """
    entry = get_whitelist_entry(url)
    if entry:
        return True, entry["rank"]
    return False, None

# Verify DB is accessible on startup
def check_whitelist_db():
    if not os.path.exists(WHITELIST_DB_PATH):
        print(f"WARNING: whitelist.db not found at {WHITELIST_DB_PATH}")
    else:
        try:
            conn = sqlite3.connect(WHITELIST_DB_PATH)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM whitelist")
            count = cursor.fetchone()[0]
            conn.close()
            print(f"whitelist.db loaded successfully — {count:,} entries found.")
        except Exception as e:
            print(f"ERROR: Could not read whitelist.db — {e}")

check_whitelist_db()

# -------------------------
# ML + Rule Engine Flow
# -------------------------

def get_combined_prediction(url):
    result = predict_with_explain(url)
    
    # Base probability of being phishing
    ml_prob = result["confidence"] if result["prediction"] == "PHISHING" else 1.0 - result["confidence"]
    
    # Rule engine optimization: run only if ML confidence is uncertain
    rule_score = 0
    rule_prob = 0.0
    if 0.3 < ml_prob < 0.7:
        rule_score = rule_engine(url)
        rule_prob = min(rule_score / 10.0, 1.0)
        final_prob = 0.7 * ml_prob + 0.3 * rule_prob
    else:
        final_prob = ml_prob
        
    pred_label = "Phishing" if final_prob > 0.5 else "Legitimate"
    abs_conf = final_prob if pred_label == "Phishing" else 1.0 - final_prob
    
    if final_prob < 0.4:
        risk_level = "Low"
    elif final_prob < 0.7:
        risk_level = "Medium"
    else:
        risk_level = "High"
        
    print(f"--- Analysis for {url} ---")
    print(f"ML Probability: {ml_prob:.4f}")
    if 0.3 < ml_prob < 0.7:
        print(f"Rule Score: {rule_score}")
        print(f"Rule Probability: {rule_prob:.4f}")
    else:
        print("Rule Engine: Skipped (High ML Confidence)")
    print(f"Final Probability: {final_prob:.4f}")
    print(f"Prediction: {pred_label}\n")
        
    return {
        "prediction": pred_label,
        "confidence": abs_conf,
        "risk_level": risk_level,
        "risk_score": final_prob * 100,
        "shap_explanation": result.get("shap_explanation", ""),
        "features": result.get("features_dict", {}),
        "shap_values": result.get("shap_values_dict", {})
    }

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
    whitelisted, rank = is_whitelisted(url)
    if whitelisted:
        confidence_score = rank_to_confidence(rank)
        return render_template(
            "index.html",
            url=url,
            prediction="Legitimate",
            confidence=f"{confidence_score}%",
            risk_level="Low",
            explanation=f"This domain is on the trusted whitelist (rank #{rank:,} of {WHITELIST_MAX_RANK:,}).",
            features={},
            shap_values={},
            FEATURE_MAP=FEATURE_MAP
        )

    # 3-6. ML Model + Rule Engine Flow
    try:
        result = get_combined_prediction(url)

        conf_percent = f"{result['confidence'] * 100:.2f}%"

        return render_template(
            "index.html",
            url=url,
            prediction=result["prediction"],
            confidence=conf_percent,
            risk_level=result["risk_level"],
            explanation=result["shap_explanation"],
            features=result["features"],
            shap_values=result["shap_values"],
            FEATURE_MAP=FEATURE_MAP
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

        # 1. Whitelist Check
        whitelisted, rank = is_whitelisted(url)
        if whitelisted:
            confidence_score = rank_to_confidence(rank)
            # Risk score for whitelisted domains is the inverse of confidence
            # i.e. rank 1 (99% confidence) → risk score ~1, rank 1M (75%) → risk score ~25
            risk_score = round(100.0 - confidence_score, 2)
            return jsonify({
                "url": url,
                "prediction": "Legitimate",
                "riskScore": risk_score,
                "riskReasons": [f"Whitelisted trusted domain (rank #{rank:,})"],
                "confidence": confidence_score,
                "is_whitelisted": True
            })

        # 2. ML Model + Rule Engine Flow
        result = get_combined_prediction(url)

        response = {
            "url": url,
            "prediction": result["prediction"],
            "riskScore": round(result["risk_score"], 2),
            "riskReasons": [result["shap_explanation"]] if result["shap_explanation"] else [],
            "features": result["features"],
            "shap_values": result["shap_values"]
        }

        return jsonify(response)

    except Exception as e:
        print(f"Error processing request: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(port=5000, debug=True)