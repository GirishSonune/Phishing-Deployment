---
description: Deploy Backend API to Azure App Service
---

# Deploy to Azure App Service

This workflow will guide you through deploying your Flask backend to Azure App Service using the Azure CLI.

## Prerequisites

- Azure CLI installed (`az`)
- Active Azure subscription
- You are logged in (`az login`)

## Steps

1. **Login to Azure** (if not already logged in):

   ```bash
   az login
   ```

2. **Navigate to the backend directory**:

   ```bash
   cd "Final/backend"
   ```

3. **Deploy using `az webapp up`**:
   This command creates the resource group, app service plan, and web app if they don't exist.
   Replace `<YOUR_UNIQUE_APP_NAME>` with a unique name (e.g., `phishing-api-girish`).

   ```bash
   az webapp up --runtime "PYTHON:3.9" --sku B1 --name <YOUR_UNIQUE_APP_NAME> --resource-group PhishingDetectionRG
   ```

4. **Configure Startup Command**:
   Tell Azure to use the startup script we created.

   ```bash
   az webapp config set --resource-group PhishingDetectionRG --name <YOUR_UNIQUE_APP_NAME> --startup-file "startup.sh"
   ```

5. **Verify Deployment**:
   Visit `https://<YOUR_UNIQUE_APP_NAME>.azurewebsites.net/` to see your running API.
