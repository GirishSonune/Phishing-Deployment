# predict.py

import joblib
import numpy as np

from feature_extractor import extract_features
from visualize import risk_meter, plot_url_features
from explain import get_shap_explainer, shap_explanation, shap_to_text

# -------------------------
# Load model & metadata
# -------------------------

MODEL_PATH = "catboost_phishing_model.pkl"
FEATURES_PATH = "feature_columns.pkl"
BACKGROUND_PATH = "shap_background.pkl"

model = joblib.load(MODEL_PATH)
feature_columns = joblib.load(FEATURES_PATH)
background_data = joblib.load(BACKGROUND_PATH)

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
    prediction = "PHISHING" if np.argmax(proba) == 1 else "SAFE"

    # Risk level
    risk = risk_meter(confidence)

    # SHAP explanation
    explainer = get_shap_explainer(model, background_data)
    shap_vals = shap_explanation(explainer, features)
    shap_text = shap_to_text(shap_vals, features)

    # Visualization (single-URL graph)
    plot_url_features(features)

    return {
        "url": url,
        "prediction": prediction,
        "confidence": round(confidence, 3),
        "risk_level": risk,
        "shap_explanation": shap_text
    }
