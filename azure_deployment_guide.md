# Azure Deployment Guide (No Docker)

This guide provides simple, step-by-step instructions to deploy your **Flask Backend** to Azure App Service and your **React Frontend** to Azure Static Web Apps.

## Prerequisites
1.  **Azure Account**: [Create one for free](https://azure.microsoft.com/free/).
2.  **VS Code Installed**.
3.  **Azure Tools Extension** for VS Code (highly recommended for "simple" deployment).
    - Install "Azure Resources" and "Azure App Service" extensions in VS Code.

---

## Part 1: Deploy Backend (Flask) to Azure App Service

We will use the **Zip Deploy** method or **VS Code Extension**, which is very straightforward.

### Step 1: Prepare the Backend
1.  Open your project in VS Code.
2.  Navigate to the `backend` folder.
3.  Ensure you have a `requirements.txt` file. If not, generate it:
    ```bash
    pip freeze > requirements.txt
    ```
4.  **Important**: Azure needs to know how to start your app. Create a file named `startup.txt` (or configure command in Azure Portal later) with:
    ```text
    python -m gunicorn --bind=0.0.0.0 --timeout 600 app:app
    ```
    *(Note: Since you are on Windows dev, just ensure your `app.py` is ready. Azure Linux plans use Gunicorn by default).*

### Step 2: Create App Service in Azure
1.  Log in to [Azure Portal](https://portal.azure.com).
2.  Search for **"App Services"** -> **Create** -> **Web App**.
3.  **Basics Tab**:
    - **Subscription**: Select yours.
    - **Resource Group**: Create new (e.g., `phishing-detection-rg`).
    - **Name**: Unique name (e.g., `phishing-backend-api`).
    - **Publish**: `Code`.
    - **Runtime stack**: `Python 3.9` (or whichever version you use).
    - **Operating System**: `Linux` (Recommended for Python).
    - **Region**: Choose one close to you.
    - **Pricing Plan**: Free (F1) or Basic (B1).
4.  **Review + create** -> **Create**. Wait for deployment to finish.

### Step 3: Deploy Code (VS Code Method)
1.  In VS Code, right-click the `backend` folder and select **"Deploy to Web App..."**.
    - *If you don't see this, install the Azure App Service extension.*
2.  Select your subscription.
3.  Select the Web App you just created (`phishing-backend-api`).
4.  Click **Deploy**.
5.  Wait for the notification "Deployment to ... completed".

### Step 4: Configure Startup Command
1.  Go to your Web App in Azure Portal.
2.  Left menu: **Settings** -> **Configuration** -> **General settings**.
3.  **Startup Command**: `gunicorn --bind=0.0.0.0 --timeout 600 app:app`
4.  **Save**.

### Step 5: Get Backend URL
1.  In Azure Portal Overview, find **Default domain** (e.g., `https://phishing-backend-api.azurewebsites.net`).
2.  **Copy this URL**. You need it for the frontend.

---

## Part 2: Deploy Frontend (React/Vite) to Azure Static Web Apps

### Step 1: Prepare Frontend
1.  Open `frontend/src/api.js` (or wherever you define your backend URL).
2.  Replace `localhost:5000` with your **new Backend Azure URL** (from Part 1, Step 5).
    - Example: `const API_BASE_URL = "https://phishing-backend-api.azurewebsites.net";`
3.  Save the file.

### Step 2: Build Locally (Optional but good to check)
1.  Open terminal in `frontend` folder.
2.  Run `npm run build`.
3.  Ensure a `dist` folder is created.

### Step 3: Create Static Web App
1.  Go to Azure Portal.
2.  Search **"Static Web Apps"** -> **Create**.
3.  **Basics Tab**:
    - **Resource Group**: Same as backend (`phishing-detection-rg`).
    - **Name**: `phishing-frontend`.
    - **Plan type**: Free.
    - **Deployment details**: Select **"GitHub"** (easiest) or **"Other"** (if you just want to drag-and-drop or use CLI).
    - *If using GitHub*: Authorize, select your repo and branch.
    - **Build Details**:
        - **Build Presets**: `React` (or `Vite`).
        - **App location**: `/frontend`
        - **Api location**: (Leave empty, we have a separate Python backend).
        - **Output location**: `dist` (standard for Vite).
4.  **Review + create** -> **Create**.

### Step 4: Verify
1.  Once deployment finishes, click **"Go to resource"**.
2.  Click the **URL** on the Overview page.
3.  Your app should be live!

---

## Troubleshooting
- **CORS Error**: If frontend fails to call backend:
    1.  Go to **Backend App Service** in Azure Portal.
    2.  Left menu: **API** -> **CORS**.
    3.  Add your **Frontend Deployment URL** to the Allowed Origins list.
    4.  Save.
- **Application Error**: Check "Log Stream" in Backend App Service to see Python errors.
