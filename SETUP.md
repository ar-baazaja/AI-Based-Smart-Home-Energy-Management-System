# Setup Instructions

## Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the Flask backend server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

## Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or the port shown in terminal)

## Usage

1. Make sure both backend and frontend servers are running
2. Open the frontend URL in your browser
3. Add appliances with their power ratings and minimum ON hours
4. Upload tariff rates (CSV format with hour,price columns)
5. Click "Optimize Schedule" to get 3 different optimization levels:
   - **Most Optimized**: Best cost savings (all loads in cheapest hours)
   - **Moderately Optimized**: Moderate cost savings (some loads in moderate hours)
   - **Least Optimized**: Still better than baseline (more loads in expensive hours)

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/optimize` - Optimize schedule
  - Request body:
    ```json
    {
      "appliances": [
        {
          "id": "app-1",
          "name": "Microwave",
          "wattage": 800,
          "isEssential": false,
          "hours": [9, 20]
        }
      ],
      "tariffRates": [
        {"hour": 0, "rate": 20},
        {"hour": 1, "rate": 20}
      ]
    }
    ```
  - Response:
    ```json
    {
      "success": true,
      "baseline": {
        "schedule": [...],
        "cost": 632.00
      },
      "results": [
        {
          "schedule": [...],
          "costBefore": 632.00,
          "costAfter": 434.00,
          "savings": 198.00,
          "savingsPercentage": 31.33
        }
      ]
    }
    ```

## Notes

- The backend uses the same GAPSO algorithm from `gapso_optimization.py`
- All 3 optimization results are better than the baseline
- The frontend allows switching between different optimization levels
- Make sure to set minimum ON hours for non-essential appliances (this is used instead of the `hours` array in the backend)

