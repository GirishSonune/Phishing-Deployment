# AEGIS Project Update: Premium UI & Explainable AI

I have significantly upgraded the project with a premium UI for the frontend and Explainable AI (SHAP) for the backend.

## 🎨 Frontend Upgrades (Premium UI)
The React Frontend (`frontend/`) has been revamped for a modern, glassmorphism-inspired aesthetic:
*   **New Design System**: Updated `tailwind.config.js` with a sophisticated color palette (sky blues, violets, deep slate) and custom animations (`fade-in-up`, `float`, `pulse-slow`).
*   **Landing Page Overhaul**: `Landing.tsx` now features:
    *   Animated background gradients.
    *   Floating 3D-style icons.
    *   Glassmorphism cards.
    *   Responsive hero section with "shimmer" buttons.

## 🧠 Backend Upgrades (Explainable AI)
The Flask Backend (`backend/`) now supports model explainability:
*   **SHAP Integration**: Added `shap` library to provide transparent explanations for why a URL is flagged as phishing.
*   **Optional Availability**: If `shap` cannot be installed, the backend will still run in "Lite Mode" without explanations.
*   **Feature Mapping**: Mapped raw feature names to readable labels.
*   **New Web UI**: The backend-served `index.html` includes a dashboard for testing the model directly.

## 🚀 How to Run

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
# Optional: Install shap for explanations
pip install shap
python app.py
```
*   Server runs at: `http://localhost:5000`
*   If `shap` is missing, you will see a warning, but the app will work.

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
*   Application runs at: `http://localhost:5173`

Visit `http://localhost:5173` to experience the new Premium UI.
