# visualize.py

import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

# -------------------------
# Risk Meter
# -------------------------
def risk_meter(confidence):
    if confidence > 0.85:
        return "HIGH RISK 🔴"
    elif confidence > 0.6:
        return "MEDIUM RISK 🟠"
    else:
        return "LOW RISK 🟢"

# -------------------------
# One-URL Feature Graph
# -------------------------
def plot_url_features(features_df, top_n=10):
    """
    Plots top N features by absolute value
    """
    features = features_df.iloc[0]
    top_features = features.abs().sort_values(ascending=False).head(top_n)

    plt.figure(figsize=(8, 4))
    top_features.plot(kind="bar")
    plt.title("Top Feature Signals for This URL")
    plt.ylabel("Feature Value")
    plt.xticks(rotation=45, ha="right")
    plt.tight_layout()
    plt.show()
