# app.py
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import re
from urllib.parse import urlparse
import os

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("SHAP not available. Explanations will be disabled.")
import numpy as np

app = Flask(__name__)
# Configure CORS to allow requests from frontend (localhost:5173)
CORS(app, resources={r"/*": {"origins": "*"}})

# -------- Load model ----------
MODEL_PATH = "phishing_rf_model.pkl"
if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(
        f"Model file not found at {MODEL_PATH}. Place phishing_rf_model.pkl next to app.py"
    )

model_data = joblib.load(MODEL_PATH)
model = model_data.get("model") if isinstance(model_data, dict) else model_data

FEATURE_NAMES = model_data.get(
    "features",
    [
        "having_IPhaving_IP_Address",
        "URLURL_Length",
        "Shortining_Service",
        "having_At_Symbol",
        "double_slash_redirecting",
        "Prefix_Suffix",
        "having_Sub_Domain",
        "HTTPS_token",
    ],
) if isinstance(model_data, dict) else [
    "having_IPhaving_IP_Address",
    "URLURL_Length",
    "Shortining_Service",
    "having_At_Symbol",
    "double_slash_redirecting",
    "Prefix_Suffix",
    "having_Sub_Domain",
    "HTTPS_token",
]

# -------- SHAP Explainer ----------
explainer = None
if SHAP_AVAILABLE:
    try:
        # TreeExplainer works perfectly for RandomForest
        explainer = shap.TreeExplainer(model)
    except Exception as e:
        print(f"Failed to initialize SHAP explainer: {e}")
        SHAP_AVAILABLE = False

# -------- Feature extraction ----------
def having_ip(url: str) -> int:
    return 1 if re.search(r"(\d{1,3}\.){3}\d{1,3}", url) else -1

def url_length_feat(url: str) -> int:
    length = len(url)
    if length < 54:
        return 0
    elif 54 <= length <= 75:
        return 1
    else:
        return 2

def shortening_service(url: str) -> int:
    shorteners = ["bit.ly", "tinyurl.com", "goo.gl", "t.co"]
    return 1 if any(s in url.lower() for s in shorteners) else -1

def having_at_symbol(url: str) -> int:
    return 1 if "@" in url else -1

def double_slash_redirecting(url: str) -> int:
    path = urlparse(url).path or ""
    return 1 if "//" in path else -1

def prefix_suffix(url: str) -> int:
    domain = urlparse(url).netloc.lower()
    return 1 if "-" in domain else -1

def having_subdomain(url: str) -> int:
    domain = urlparse(url).netloc
    dots = domain.count(".")
    if dots == 1:
        return -1
    elif dots == 2:
        return 0
    else:
        return 1

def https_token(url: str) -> int:
    return 1 if url.lower().startswith("https://") else -1

def extract_features_same_as_dataset(url: str):
    return [
        having_ip(url),
        url_length_feat(url),
        shortening_service(url),
        having_at_symbol(url),
        double_slash_redirecting(url),
        prefix_suffix(url),
        having_subdomain(url),
        https_token(url),
    ]

# -------- Routes ----------
@app.route("/", methods=["GET"])
def home():
    return render_template("index.html")

@app.route("/predict", methods=["POST"])
def predict():
    url = request.form.get("url", "").strip()
    if not url:
        return render_template("index.html", error="Please enter a URL")

    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "http://" + url

    feats = extract_features_same_as_dataset(url)
    X = pd.DataFrame([feats], columns=FEATURE_NAMES)

    try:
        pred = int(model.predict(X)[0])
        proba = model.predict_proba(X)[0][pred]
    except Exception as e:
        return render_template("index.html", error=f"Prediction error: {e}")

    label = "Phishing" if pred == 1 else "Legitimate"
    feat_display = dict(zip(FEATURE_NAMES, feats))

    # -------- SHAP Explanation ----------
    shap_explanation = {}
    if SHAP_AVAILABLE and explainer:
        try:
            shap_values = explainer.shap_values(X)
            # For binary classification: class 1 = phishing
            shap_vals = shap_values[1][0]

            shap_explanation = dict(
                sorted(
                    zip(FEATURE_NAMES, shap_vals),
                    key=lambda x: abs(x[1]),
                    reverse=True,
                )
            )
        except Exception as e:
             print(f"SHAP explanation failed: {e}")

    # Map raw feature names to readable labels
    FEATURE_MAP = {
        "having_IPhaving_IP_Address": "IP Address",
        "URLURL_Length": "URL Length",
        "Shortining_Service": "Shortening Service",
        "having_At_Symbol": "@ Symbol",
        "double_slash_redirecting": "Double Slash Redirect",
        "Prefix_Suffix": "Prefix/Suffix",
        "having_Sub_Domain": "Sub-Domain",
        "HTTPS_token": "HTTPS Token"
    }

    return render_template(
        "index.html",
        url=url,
        prediction=label,
        confidence=f"{proba*100:.2f}%",
        features=feat_display,
        shap_values=shap_explanation,
        FEATURE_MAP=FEATURE_MAP
    )

@app.route("/api/predict", methods=["POST"])
def api_predict():
    data = request.get_json() or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "no url provided"}), 400

    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "http://" + url

    feats = extract_features_same_as_dataset(url)
    X = pd.DataFrame([feats], columns=FEATURE_NAMES)

    try:
        pred = int(model.predict(X)[0])
        # Get probability of class 1 (phishing)
        proba = model.predict_proba(X)[0][1]
        shap_values_dict = {}
        if SHAP_AVAILABLE and explainer:
             try:
                shap_values = explainer.shap_values(X)[1][0]
                shap_values_dict = dict(zip(FEATURE_NAMES, shap_values))
             except Exception:
                pass
    except Exception as e:
        return jsonify({"error": f"prediction failed: {e}"}), 500

    label = "phishing" if pred == 1 else "legitimate"

    return jsonify(
        {
            "url": url,
            "prediction": label,
            "riskScore": proba * 100,
            "riskReasons": [], # Placeholder for now
            "features": dict(zip(FEATURE_NAMES, feats)),
            "shap_values": shap_values_dict,
        }
    )

# -------- Main ----------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
