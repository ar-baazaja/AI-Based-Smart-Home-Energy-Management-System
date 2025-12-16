# Setting VITE_API_URL in Vercel

## Quick Steps

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your project: `AI-Based-Smart-Home-Energy-Management-System`

2. **Navigate to Settings**
   - Click on your project
   - Go to **Settings** tab (in the top menu)
   - Click **Environment Variables** (in the left sidebar)

3. **Add Environment Variable**
   - Click **Add New**
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL (e.g., `https://your-backend.railway.app`)
   - **Environment**: Select all (Production, Preview, Development)
   - Click **Save**

4. **Redeploy**
   - Go to **Deployments** tab
   - Click the **⋯** (three dots) on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic redeploy

## Backend URL Examples

- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- PythonAnywhere: `https://yourusername.pythonanywhere.com`
- Heroku: `https://your-app.herokuapp.com`

## Verify It Works

After redeploying:
1. Open your Vercel app URL
2. Check browser console (F12)
3. Should see "Backend connected" (no warning message)
4. Optimization should be faster (using backend)

## Testing Backend URL

Before setting the variable, test your backend:
```bash
curl https://your-backend-url.com/api/health
```

Should return: `{"status": "ok"}`

---

**Note**: If you haven't deployed the backend yet, see `BACKEND_DEPLOYMENT.md` for deployment instructions.

