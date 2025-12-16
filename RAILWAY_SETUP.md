# Railway Backend Setup Guide

## ✅ Your Railway Deployment

Your backend is deployed on Railway! Here's how to complete the setup:

## Step 1: Get Your Railway Backend URL

1. **Go to your Railway Dashboard**: https://railway.com/dashboard
2. **Select your project** (the one you just deployed)
3. **Click on your service** (the Flask backend)
4. **Go to the "Settings" tab**
5. **Scroll to "Domains" section**
6. **Copy your Railway URL** - It will look like:
   - `https://your-app-name.up.railway.app`
   - Or `https://your-service-name-production.up.railway.app`

## Step 2: Test Your Backend

Open your Railway URL in a browser or use curl:
```bash
curl https://your-railway-url.up.railway.app/api/health
```

Should return: `{"status": "ok"}`

## Step 3: Set Environment Variable in Vercel

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project**: `AI-Based-Smart-Home-Energy-Management-System`
3. **Go to Settings** → **Environment Variables**
4. **Add New Variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-railway-url.up.railway.app` (your Railway URL from Step 1)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

## Step 4: Redeploy Frontend

1. **Go to Deployments tab** in Vercel
2. **Click the three dots (⋯)** on the latest deployment
3. **Click "Redeploy"**
   - OR push a new commit to trigger automatic redeploy

## Step 5: Verify It Works

1. **Open your Vercel app URL**
2. **Check the page** - the warning message should be gone
3. **Open browser console (F12)**
4. **Should see**: No "Backend server not reachable" warning
5. **Try optimization** - should be faster (using backend)

## Railway Configuration

Your `app.py` has been updated to:
- ✅ Use Railway's `PORT` environment variable
- ✅ Run in production mode (debug=False)
- ✅ Listen on `0.0.0.0` (required for Railway)

## Troubleshooting

### Backend not responding?
1. Check Railway logs: Railway Dashboard → Your Service → Logs
2. Verify the service is running (should show "Deployed")
3. Check if port is set correctly (Railway auto-sets `PORT`)

### CORS errors?
- Your `app.py` has `CORS(app)` which allows all origins
- This should work, but if you get CORS errors, update to:
  ```python
  CORS(app, origins=["https://your-vercel-app.vercel.app"])
  ```

### Health check fails?
- Make sure `/api/health` endpoint is working
- Test: `curl https://your-railway-url/api/health`

## Quick Reference

- **Railway Dashboard**: https://railway.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Backend URL**: Check Railway project → Settings → Domains
- **Environment Variable**: `VITE_API_URL` = Your Railway URL

---

**Once you set `VITE_API_URL` in Vercel and redeploy, your frontend will automatically connect to your Railway backend!** 🚀

