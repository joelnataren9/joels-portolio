# Deploy to Azure Web App

This guide covers deploying the portfolio to Azure Portal (App Service and Static Web Apps).

---

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- Azure account with a subscription
- GitHub repo (for CI/CD) or use manual deploy

---

## 1. Backend (FastAPI) → Azure App Service

**Data vs API:** Posts and other content live in **Firebase (Firestore)**. The `backend/` app is a **FastAPI service** that reads and writes Firestore using the Firebase Admin SDK. You configure Firestore and service-account credentials in **Firebase / Azure app settings**; **`az webapp deploy` only publishes the Python API** to App Service—it does not “deploy” Firestore itself (that stays in Firebase).

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
| `JWT_SECRET` | *(Required, 32+ chars — generate with `openssl rand -hex 32`)* |
| `ALLOWED_ADMIN_EMAILS` | *(Required — your admin email(s), comma-separated. Empty = nobody can sign in)* |
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

**Option A: Deploy from local (zip)**

1. Sign in: `az login` (and pick the right subscription with `az account set --subscription <id>` if needed).

2. From the repo root, build a zip of the `backend` folder (contents at zip root should be `app/`, `requirements.txt`, etc.—not a nested `backend/` folder):

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
cd ..
```

3. Push the zip to the Web App using **either** command (same outcome; `az webapp deploy` is the current one-stop command):

```bash
# Preferred: unified deploy (Azure CLI 2.48+)
az webapp deploy \
  --resource-group personal_portfolio \
  --name joels-portfolio \
  --src-path backend.zip \
  --type zip

# Alternative: older zip API (still supported)
az webapp deployment source config-zip \
  --resource-group personal_portfolio \
  --name joels-portfolio \
  --src backend.zip
```

**Option B: Deploy from GitHub Actions (recommended)**

`.github/workflows/azure-backend.yml` runs the backend tests on every PR and push that touches `backend/`, and on pushes to `master` it zips `app/`, `requirements.txt` and `startup.sh`, runs the same `az webapp deploy` as Option A, then checks `/health/`. You can also run it by hand from the Actions tab (deploys only from `master`).

It signs in to Azure with OpenID Connect, not a publish profile (basic-auth publishing is disabled on the app). One-time setup:

This login sees several directories, so pin the Pay-As-You-Go subscription first: the app registration must live in its directory (tenant `b3fcc27f-…`), which is where `joels-portfolio` runs.

```bash
az account set --subscription "Pay-As-You-Go"
SUB_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

# Identity for GitHub Actions, allowed to deploy only to this one web app
APP_ID=$(az ad app create --display-name gh-joels-portfolio-backend-deploy --query appId -o tsv)
az ad sp create --id "$APP_ID"
az role assignment create --assignee "$APP_ID" --role "Website Contributor" \
  --scope "/subscriptions/$SUB_ID/resourceGroups/personal_portfolio/providers/Microsoft.Web/sites/joels-portfolio"

# Trust GitHub's OIDC tokens, but only for workflow runs on master
az ad app federated-credential create --id "$APP_ID" --parameters '{
  "name": "github-master",
  "issuer": "https://token.actions.githubusercontent.com",
  "subject": "repo:joelnataren9/joels-portolio:ref:refs/heads/master",
  "audiences": ["api://AzureADTokenExchange"]
}'

gh secret set AZURE_CLIENT_ID --body "$APP_ID"
gh secret set AZURE_TENANT_ID --body "$TENANT_ID"
gh secret set AZURE_SUBSCRIPTION_ID --body "$SUB_ID"
```

App settings (Firebase credentials, `JWT_SECRET`, etc.) stay in Azure; the workflow never reads or changes them.

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

Create or update the app, then configure Application settings in the Portal:

```bash
cd backend
az webapp up --name joels-portfolio --resource-group personal_portfolio --runtime "PYTHON:3.11"
```

Ongoing code updates: build `backend.zip` as in **Option A** (zip ends up next to the `backend/` folder), then from the repo root run `az webapp deploy --resource-group personal_portfolio --name joels-portfolio --src-path backend.zip --type zip`.

### Frontend

Use **Zip deploy** or **Local Git** from the Azure Portal Deployment Center.
