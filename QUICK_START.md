# Quick Start Guide - Frontend & Backend Connection

## 🚀 Step-by-Step Setup

### 1. Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 2. Start Backend Server
**Option A: Using the batch file (Windows)**
```bash
START_BACKEND.bat
```

**Option B: Using Python directly**
```bash
python app.py
```

The backend will start on **http://localhost:5000**

You should see:
```
 * Running on http://0.0.0.0:5000
```

### 3. Install Frontend Dependencies (if not already done)
```bash
npm install
```

### 4. Start Frontend Server
**Option A: Using the batch file (Windows)**
```bash
START_FRONTEND.bat
```

**Option B: Using npm**
```bash
npm run dev
```

The frontend will start on **http://localhost:5173** (or another port if 5173 is busy)

### 5. Open in Browser
Open your browser and go to: **http://localhost:5173**

## ✅ Connection Status

The frontend automatically checks if the backend is connected:
- ✅ **Green indicator**: Backend is connected and ready
- ⚠️ **Red warning**: Backend is not running - start it first!

## 🔧 Troubleshooting

### Backend not connecting?
1. Check if Flask is running: Open http://localhost:5000/api/health in browser
2. Should return: `{"status": "ok"}`
3. If not, check:
   - Python is installed
   - Dependencies are installed: `pip install -r requirements.txt`
   - Port 5000 is not in use by another application

### Frontend can't reach backend?
1. Check browser console (F12) for errors
2. Verify backend is running on http://localhost:5000
3. Check CORS settings (should be enabled in app.py)
4. Try accessing backend directly: http://localhost:5000/api/health

### Test Backend Connection
Run the test script:
```bash
python test_backend.py
```

## 📝 API Endpoints

- **Health Check**: `GET http://localhost:5000/api/health`
- **Optimize**: `POST http://localhost:5000/api/optimize`

## 🎯 Usage Flow

1. **Start Backend** → `python app.py`
2. **Start Frontend** → `npm run dev`
3. **Open Browser** → http://localhost:5173
4. **Add Appliances** → Configure your electrical loads
5. **Upload Tariff** → Upload CSV or use demo data
6. **Optimize** → Click "Optimize Schedule" button
7. **View Results** → See 3 optimization levels with different cost savings

## 🔄 Development Mode

Both servers support hot-reload:
- **Backend**: Restart Flask server after code changes
- **Frontend**: Automatically reloads on file changes

## 📦 What's Connected?

- ✅ Frontend calls backend API at `http://localhost:5000/api/optimize`
- ✅ Backend uses CORS to allow frontend requests
- ✅ Frontend displays connection status
- ✅ Error handling for connection issues
- ✅ Health check on page load

---

**Need Help?** Check the console logs in browser (F12) and terminal for error messages.

