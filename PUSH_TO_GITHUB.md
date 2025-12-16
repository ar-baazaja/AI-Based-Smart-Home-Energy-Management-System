# Push to GitHub - Quick Guide

## Step 1: Create Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Make sure you're logged in as **ar-baazaja**
3. Click **"Generate new token (classic)"**
4. Name it: "FYP Project Upload"
5. Select expiration: **90 days** (or No expiration)
6. Check the **`repo`** scope (full control of private repositories)
7. Click **"Generate token"**
8. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

## Step 2: Push Using Token

After you have your token, run this command in PowerShell:

```powershell
cd "D:\Fajar FYP"
git push -u origin main
```

When prompted:
- **Username**: `ar-baazaja`
- **Password**: **Paste your personal access token** (NOT your GitHub password)

## Alternative: Use Token in URL (One-time)

If you prefer, you can embed the token in the remote URL:

```powershell
cd "D:\Fajar FYP"
git remote set-url origin https://YOUR_TOKEN@github.com/ar-baazaja/AI-Based-Smart-Home-Energy-Management-System.git
git push -u origin main
```

(Replace YOUR_TOKEN with your actual token)

## Verify

After successful push, check:
https://github.com/ar-baazaja/AI-Based-Smart-Home-Energy-Management-System

