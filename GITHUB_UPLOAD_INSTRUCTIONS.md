# GitHub Upload Instructions

## Authentication Required

The repository requires authentication. Choose one of these methods:

### Method 1: Personal Access Token (Easiest)

1. **Create a Personal Access Token:**
   - Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name (e.g., "FYP Project")
   - Select scopes: `repo` (full control of private repositories)
   - Click "Generate token"
   - **Copy the token immediately** (you won't see it again!)

2. **Push using the token:**
   ```bash
   git push -u origin main
   ```
   When prompted:
   - Username: `ar-baazaja`
   - Password: **Paste your personal access token** (not your GitHub password)

### Method 2: SSH Key (More Secure)

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add SSH key to GitHub:**
   - Copy your public key: `cat ~/.ssh/id_ed25519.pub`
   - Go to GitHub.com → Settings → SSH and GPG keys → New SSH key
   - Paste the key and save

3. **Change remote URL to SSH:**
   ```bash
   git remote set-url origin git@github.com:ar-baazaja/AI-Based-Smart-Home-Energy-Management-System.git
   git push -u origin main
   ```

### Method 3: GitHub CLI

```bash
gh auth login
git push -u origin main
```

## Current Status

✅ Git repository initialized
✅ All files committed (123 files, 15,517 insertions)
✅ Remote repository added
❌ Push pending (authentication required)

## After Authentication

Once authenticated, run:
```bash
git push -u origin main
```

Your code will be uploaded to:
https://github.com/ar-baazaja/AI-Based-Smart-Home-Energy-Management-System


