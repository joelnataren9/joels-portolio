# Deploy to Azure Web App

This guide covers deploying the portfolio to Azure Portal (App Service and Static Web Apps).

---

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Azure account with a subscription
- GitHub repo (for CI/CD) or use manual deploy

---

## 1. Backend (FastAPI) → Azure App Service

### Create the Web App in Azure Portal

1. Go to [Azure Portal](https://portal.azure.com) → **Create a resource** → **Web App**
2. Fill in:
   - **Subscription**: Your subscription
   - **Resource group**: e.g. `personal_portfolio`
   - **Name**: e.g. `joels-portfolio` (your app: joels-portfolio)
   - **Publish**: Code
   - **Runtime stack**: Python 3.11
   - **Region**: Your preferred region
3. Click **Review + create** → **Create**

### Configure the Backend

1. In your Web App → **Configuration** → **Application settings**
2. Add these settings (use **+ New application setting**):

| Name | Value |
|------|-------|
| `SCM_DO_BUILD_DURING_DEPLOYMENT` | `true` |
| `FIREBASE_PROJECT_ID` | `joels-portfolio-2f583` |
| `FIREBASE_CREDENTIALS_JSON` | *(Paste full JSON from your Firebase service account key file)* |
| `JWT_SECRET` | *(Generate a strong secret, e.g. `openssl rand -hex 32`)* |
| `FIREBASE_API_KEY` | *(From Firebase Console)* |
| `FIREBASE_AUTH_DOMAIN` | `joels-portfolio-2f583.firebaseapp.com` |
| `FIREBASE_STORAGE_BUCKET` | `joels-portfolio-2f583.firebasestorage.app` |
| `FIREBASE_MESSAGING_SENDER_ID` | `719665161324` |
| `FIREBASE_APP_ID` | `1:719665161324:web:1d053ed21e9f6b2ce3e449` |
| `FIREBASE_POSTS_COLLECTION` | `posts` |
| `FIREBASE_PROJECTS_COLLECTION` | `projects` |

3. For **FIREBASE_CREDENTIALS_JSON**: Copy the entire contents of `joels-portfolio-2f583-firebase-adminsdk-*.json` (as a single-line string; escape quotes if needed, or use the raw JSON).

### Set Startup Command

1. Web App → **Configuration** → **General settings**
2. **Startup Command**:
   ```
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

### Deploy the Backend

**Option A: Deploy from local (Zip deploy)**

```bash
cd backend
# Exclude Firebase service account keys, venv, and junk (never ship *.json keys in the zip)
zip -r ../backend.zip . \
  -x "*.git*" \
  -x "*__pycache__*" \
  -x "*.pyc" \
  -x ".venv/*" \
  -x "venv/*" \
  -x "*.env" \
  -x "*firebase-adminsdk*.json" \
  -x "*serviceAccountKey*.json"
az webapp deployment source config-zip \
  --resource-group personal_portfolio \
  --name joels-portfolio \
  --src ../backend.zip
```

**Option B: Deploy from GitHub (recommended)**

1. Web App → **Deployment Center**
2. Source: **GitHub** → Authorize and select your repo
3. Branch: `main`, Build provider: **GitHub Actions**
4. After the first deploy, add the publish profile to GitHub:
   - Web App → **Get publish profile** → Download
   - GitHub repo → **Settings** → **Secrets and variables** → **Actions**
   - New secret: `AZURE_WEBAPP_PUBLISH_PROFILE_BACKEND` = contents of the publish profile

5. The workflow already uses `joels-portfolio` as the app name.

### Backend URL

After deploy, your backend will be at:
```
https://joels-portfolio.azurewebsites.net
```

Use this URL for the frontend `NEXT_PUBLIC_API_BASE_URL`.

---

## 2. Frontend (Next.js) → Azure Static Web Apps

### Create Static Web App in Azure Portal

1. **Create a resource** → **Static Web App**
2. Fill in:
   - **Subscription** and **Resource group**
   - **Name**: e.g. `portfolio-frontend`
   - **Deploy details**: Choose **GitHub** or **Other**
   - **Organization/Repository**: Your GitHub repo
   - **Branch**: `main`
   - **Build Presets**: Custom
   - **App location**: `/frontend`
   - **Output location**: `.next`
   - **Build command**: `npm run build`
3. Click **Review + create** → **Create**

### Configure Frontend Environment

1. Static Web App → **Configuration** → **Application settings**
2. Add:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://joels-portfolio.azurewebsites.net`

Or set `NEXT_PUBLIC_API_BASE_URL` as a GitHub variable (Settings → Variables) so it’s available during build.

### Alternative: Frontend on Azure App Service (Node.js)

If you prefer App Service instead of Static Web Apps:

1. Create a **Web App** with **Node 20 LTS**
2. **Startup Command**: `npm run start`
3. Deploy the `frontend` folder and ensure `npm run build` runs before `npm run start`
4. Set `NEXT_PUBLIC_API_BASE_URL` in Application settings

---

## 3. CORS (Backend)

The backend allows all origins (`*`). If you restrict CORS later, add your frontend URL (e.g. `https://portfolio-frontend.azurestaticapps.net`) to the allowed origins.

---

## 4. Quick Reference

| Component | Azure Service | URL pattern |
|-----------|---------------|-------------|
| Backend | App Service | `https://joels-portfolio.azurewebsites.net` |
| Frontend | Static Web Apps | `https://<app-name>.azurestaticapps.net` |

---

## 5. Manual Deploy (No GitHub)

### Backend

```bash
cd backend
az webapp up --name joels-portfolio --resource-group personal_portfolio --runtime "PYTHON:3.11"
# Then configure Application settings in the Portal
```

### Frontend

Use **Zip deploy** or **Local Git** from the Azure Portal Deployment Center.
