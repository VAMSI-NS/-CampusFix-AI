# GitHub Pages Deployment Setup Guide
## Configuring the Backend URL for GitHub Pages

---

## **PROBLEM**
When accessing the app from another device via GitHub Pages URL, login fails because:
- Frontend is at: `https://vamsi-ns.github.io/-CampusFix-AI/`
- API calls go to: `https://vamsi-ns.github.io/-CampusFix-AI/api/...` ❌
- Actual backend is at: `https://your-backend-url.com` ✅

**Result**: Login form can't connect to authentication server.

---

## **SOLUTION: Set GitHub Actions Variable**

The GitHub Actions workflow needs your actual backend URL. Here's how:

### **Step 1: Get Your Backend URL**

Your backend is running on:
- **Local Development**: `http://localhost:8000` (only works on same machine)
- **Render Deployment**: `https://campusfix-api.onrender.com` (or your Render URL)
- **Other Cloud**: Your actual backend HTTPS URL

**⚠️ MUST BE HTTPS** - GitHub Actions workflow requires HTTPS for security.

### **Step 2: Add GitHub Repository Variable**

1. Go to your GitHub repository
2. Click **Settings** tab
3. Left sidebar → **Secrets and variables** → **Actions**
4. Click **New repository variable**
5. Create variable:
   ```
   Name: PUBLIC_HTTPS_BACKEND_URL
   Value: https://your-actual-backend-url.com
   
   Example:
   Value: https://campusfix-api.onrender.com
   ```
6. Click **Add variable**

### **Step 3: Rebuild and Deploy**

Push a new commit to trigger the workflow:
```bash
git add .
git commit -m "Trigger frontend rebuild with backend URL"
git push origin main
```

Or manually trigger:
1. Go to GitHub repo → **Actions** tab
2. Select **Deploy CampusFix AI Frontend to GitHub Pages**
3. Click **Run workflow** → **Run workflow** again
4. Wait for build to complete

---

## **How It Works**

```
OLD (BROKEN):
Frontend → /api/auth/login 
  → https://vamsi-ns.github.io/-CampusFix-AI/api/auth/login ❌
  → 404 GitHub Pages error

NEW (FIXED):
Frontend → /api/auth/login
  → https://campusfix-api.onrender.com/api/auth/login ✅
  → Success! Backend responds with login token
```

---

## **VERIFICATION**

After deployment, test login from another device:

1. Go to: `https://vamsi-ns.github.io/-CampusFix-AI/`
2. Click "Host Sign In"
3. Enter valid credentials:
   - Username: `vamsi`
   - Password: `vamsi@123`
4. Should see: ✅ Login successful

---

## **TROUBLESHOOTING**

### ❌ Still showing GitHub URLs?
- Check that GitHub variable is set correctly
- Wait 5 minutes after setting variable (caching)
- Clear browser cache and reload
- Run workflow manually again

### ❌ Build fails with "PUBLIC_HTTPS_BACKEND_URL is required"?
- Variable not set in GitHub repository
- Variable name must be exactly: `PUBLIC_HTTPS_BACKEND_URL`
- Needs to start with `https://`

### ❌ Login still fails after setting URL?
- Backend URL might be wrong
- Backend might not be running
- Backend might not accept requests from GitHub Pages domain
- Check backend CORS settings

---

## **CORS CONFIGURATION**

Your backend must allow requests from GitHub Pages:

**File**: `render.yaml` or `.env`

```yaml
# render.yaml
  envVars:
    - key: CORS_ORIGINS
      value: https://vamsi-ns.github.io
```

Or **File**: `backend/.env`

```
CORS_ORIGINS=https://vamsi-ns.github.io,http://localhost:5173
```

---

## **LOCAL DEVELOPMENT (Same Device)**

Local development uses Vite proxy, so it works without GitHub variable:

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
# Proxy automatically routes /api → http://localhost:8000
```

---

## **CURRENT STATUS**

Current deployment configuration:
- ✅ Workflow file configured correctly
- ✅ Security checks in place (HTTPS required)
- ✅ Frontend repository: GitHub Pages
- ❌ Backend URL variable: **NOT SET** ← **ACTION NEEDED**

**Next Action**: Set `PUBLIC_HTTPS_BACKEND_URL` in GitHub repository settings.

---

*Setup Guide for CampusFix AI*  
*Updated: 2026-08-27*
