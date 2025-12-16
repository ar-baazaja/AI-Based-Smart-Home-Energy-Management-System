# Fix GitHub Authentication

## Problem
Git is trying to use account `shaz2327` but the repository belongs to `ar-baazaja`.

## Solution: Use Personal Access Token

### Step 1: Create Personal Access Token
1. Go to: https://github.com/settings/tokens
2. Make sure you're logged in as **ar-baazaja** account
3. Click **"Generate new token (classic)"**
4. Name it: "FYP Project Upload"
5. Select expiration: **90 days** (or No expiration)
6. Check the **`repo`** scope (full control of private repositories)
7. Click **"Generate token"**
8. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Update Git Credentials
Run these commands in PowerShell:

```powershell
cd "D:\Fajar FYP"

# Clear cached credentials
git credential-manager-core erase
# Or if that doesn't work:
git config --global --unset credential.helper
git config --global credential.helper store

# Try pushing again (will prompt for credentials)
git push -u origin main
```

When prompted:
- **Username**: `ar-baazaja`
- **Password**: **Paste your personal access token** (NOT your GitHub password)

### Alternative: Use Token in URL (One-time)
```powershell
git remote set-url origin https://YOUR_TOKEN@github.com/ar-baazaja/AI-Based-Smart-Home-Energy-Management-System.git
git push -u origin main
```
(Replace YOUR_TOKEN with your actual token)

### Step 3: Verify Push
After successful push, check:
https://github.com/ar-baazaja/AI-Based-Smart-Home-Energy-Management-System

## Quick Test
After setting up, test with:
```powershell
git push -u origin main
```

If successful, you'll see:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
Writing objects: 100% (X/X), done.
To https://github.com/ar-baazaja/AI-Based-Smart-Home-Energy-Management-System.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

