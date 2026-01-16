# predict.py

import joblib
import numpy as np
import os
from feature_extractor import extract_features
# from visualize import risk_meter, plot_url_features # defined in visualize.py but unused in API response directly or causing issues
from explain import get_shap_explainer, shap_explanation, shap_to_text

# -------------------------
# Load model & metadata
# -------------------------

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "Model", "catboost_phishing_model.pkl")
FEATURES_PATH = os.path.join(BASE_DIR, "Model", "feature_columns.pkl")
BACKGROUND_PATH = os.path.join(BASE_DIR, "Model", "shap_background.pkl")

model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(FEATURES_PATH)
background_data = joblib.load(BACKGROUND_PATH)

# Helper function for risk meter (simplified if visualize.py is missing or problematic)
def risk_meter(confidence):
    if confidence < 0.3:
        return "Low"
    elif confidence < 0.7:
        return "Medium"
    else:
        return "High"

# -------------------------
# Main prediction function
# -------------------------

def predict_with_explain(url):
    # Extract features
    features = extract_features(url)

    # Ensure correct feature order
    features = features[feature_columns]

    # Prediction
    proba = model.predict_proba(features)[0]
    confidence = float(np.max(proba))
    prediction_idx = np.argmax(proba)
    
    prediction = "PHISHING" if prediction_idx == 1 else "SAFE"
    
    # Risk level
    risk = risk_meter(confidence)

    # SHAP explanation
    try:
        explainer = get_shap_explainer(model, background_data)
        shap_vals = shap_explanation(explainer, features)
        shap_text = shap_to_text(shap_vals, features)
    except Exception as e:
        print(f"SHAP Error: {e}")
        shap_text = "Explanation unavailable"

    return {
        "url": url,
        "prediction": prediction,
        "confidence": round(confidence, 3),
        "risk_level": risk,
        "shap_explanation": shap_text
    }
