# Vercel Deployment Guide

## Issue Fixed
The error "Command 'pip3 install' exited with 2" occurred because Vercel was detecting `requirements.txt` and trying to install Python dependencies. This project is a **frontend-only** deployment to Vercel.

## Solution
Created `vercel.json` to explicitly configure Vercel to:
- Only build the Node.js/React frontend
- Ignore Python backend files
- Use Vite build system

## Deployment Steps

1. **Push the updated `vercel.json` to GitHub**
2. **Deploy to Vercel** (connect your GitHub repo or redeploy)
3. **Set Environment Variable** (if backend is deployed separately):
   - Go to Vercel Project Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-backend-url.com`
   - If not set, frontend will default to `http://localhost:5000` (won't work in production)

## Backend Deployment

The Python Flask backend (`app.py`) should be deployed separately to:
- **Railway** (recommended)
- **Render**
- **Heroku**
- **PythonAnywhere**
- Or any Python hosting service

Then update `VITE_API_URL` in Vercel to point to your deployed backend.

## Files Configured

- ✅ `vercel.json` - Vercel build configuration
- ✅ `.vercelignore` - Excludes Python files from build

## Testing

After deployment:
1. Frontend should load at your Vercel URL
2. Backend connection status will show as disconnected (until backend is deployed)
3. Once backend is deployed, update `VITE_API_URL` and redeploy

