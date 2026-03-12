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

MODEL_PATH = os.path.join(BASE_DIR, "Model", "lexical_feature_catboost_model.pkl")
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
        
        # Extract raw values for frontend visualization
        if isinstance(shap_vals, list):
            shap_dict = dict(zip(features.columns, shap_vals[1][0]))
        else:
            shap_dict = dict(zip(features.columns, shap_vals[0]))
    except Exception as e:
        print(f"SHAP Error: {e}")
        shap_text = "Explanation unavailable"
        shap_dict = {}

    return {
        "url": url,
        "prediction": prediction,
        "confidence": round(confidence, 3),
        "risk_level": risk,
        "shap_explanation": shap_text,
        "features_dict": features.iloc[0].to_dict(),
        "shap_values_dict": shap_dict
    }
