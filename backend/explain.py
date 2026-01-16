# explain.py

import shap
import numpy as np

def get_shap_explainer(model, background_data):
    """
    Create a SHAP TreeExplainer for CatBoost
    """
    return shap.TreeExplainer(model, background_data)


def shap_explanation(explainer, features_df):
    """
    Compute SHAP values for a single URL
    """
    shap_values = explainer.shap_values(features_df)
    return shap_values


def shap_to_text(shap_values, features_df, top_n=3):
    """
    Convert SHAP values into human-readable explanations
    """
    feature_names = features_df.columns

    # If SHAP returns list (CatBoost multiclass/binary)
    if isinstance(shap_values, list):
        shap_values = shap_values[1]  # phishing class

    shap_vals = shap_values[0]

    importance = list(zip(feature_names, shap_vals))
    importance.sort(key=lambda x: abs(x[1]), reverse=True)

    explanations = []

    for feat, val in importance[:top_n]:
        feat_readable = feat.replace("_", " ")
        if val > 0:
            explanations.append(f"{feat_readable} increases phishing risk")
        else:
            explanations.append(f"{feat_readable} reduces phishing risk")

    return explanations
