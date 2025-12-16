# Backend Deployment Guide

## Overview
Your Flask backend needs to be deployed separately from the Vercel frontend. This guide covers deployment options.

## Quick Setup for Vercel Frontend

### Option 1: Set Environment Variable (Recommended)
1. Deploy your Flask backend to one of the services below
2. Get your backend URL (e.g., `https://your-backend.railway.app`)
3. In Vercel Dashboard:
   - Go to your project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com`
   - Redeploy your frontend

### Option 2: Use Client-Side Fallback (Current)
The frontend now automatically falls back to client-side optimization when the backend is unavailable. This works but may be slower for large datasets.

---

## Backend Deployment Options

### 1. Railway (Recommended - Easy & Free)

1. **Sign up**: https://railway.app
2. **Create new project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Configure**:
   - Root Directory: `/` (or create a `backend/` folder)
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
5. **Get your URL**: Railway provides a URL like `https://your-app.railway.app`
6. **Set environment variable in Vercel**: `VITE_API_URL=https://your-app.railway.app`

### 2. Render (Free Tier Available)

1. **Sign up**: https://render.com
2. **New** → "Web Service"
3. **Connect GitHub** and select your repo
4. **Configure**:
   - Environment: `Python 3`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
5. **Get your URL**: Render provides a URL like `https://your-app.onrender.com`
6. **Set environment variable in Vercel**: `VITE_API_URL=https://your-app.onrender.com`

### 3. PythonAnywhere (Free Tier)

1. **Sign up**: https://www.pythonanywhere.com
2. **Upload files** via web interface
3. **Configure WSGI file** to point to `app.py`
4. **Get your URL**: `https://yourusername.pythonanywhere.com`
5. **Set environment variable in Vercel**: `VITE_API_URL=https://yourusername.pythonanywhere.com`

### 4. Heroku (Paid, but reliable)

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli
2. **Create `Procfile`**:
   ```
   web: python app.py
   ```
3. **Deploy**:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```
4. **Get your URL**: `https://your-app-name.herokuapp.com`
5. **Set environment variable in Vercel**: `VITE_API_URL=https://your-app-name.herokuapp.com`

---

## Important Notes

### CORS Configuration
Make sure your `app.py` has CORS enabled for your Vercel domain:

```python
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://your-vercel-app.vercel.app", "http://localhost:5173"])
```

### Environment Variables
- **Backend**: May need to set `FLASK_ENV=production` and `PORT=5000` (or your service's port)
- **Frontend (Vercel)**: Set `VITE_API_URL` to your deployed backend URL

### Testing
After deployment:
1. Test backend directly: `https://your-backend-url.com/api/health`
2. Should return: `{"status": "ok"}`
3. Frontend should automatically connect once `VITE_API_URL` is set

---

## Current Status

✅ **Frontend**: Deployed on Vercel with client-side fallback  
⏳ **Backend**: Needs deployment (choose one of the options above)  
✅ **Fallback**: Frontend works without backend (uses client-side optimizer)

---

## Quick Test

Once backend is deployed:
1. Set `VITE_API_URL` in Vercel
2. Redeploy frontend
3. Check browser console - should see "Backend connected" message
4. Try optimization - should use backend (faster)

