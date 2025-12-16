import requests
import json

# Test data
test_data = {
    "appliances": [
        {
            "id": "app-1",
            "name": "Microwave",
            "wattage": 800,
            "isEssential": False,
            "hours": [9, 20]  # 2 hours minimum
        },
        {
            "id": "app-2",
            "name": "Fan",
            "wattage": 100,
            "isEssential": False,
            "hours": [22, 23, 0, 1, 2, 3]  # 6 hours minimum
        },
        {
            "id": "app-3",
            "name": "AC",
            "wattage": 1500,
            "isEssential": False,
            "hours": [13, 14, 15, 16, 17, 18, 19, 20]  # 8 hours minimum
        }
    ],
    "tariffRates": [
        {"hour": 0, "rate": 20}, {"hour": 1, "rate": 20}, {"hour": 2, "rate": 20},
        {"hour": 3, "rate": 20}, {"hour": 4, "rate": 20}, {"hour": 5, "rate": 20},
        {"hour": 6, "rate": 22}, {"hour": 7, "rate": 22}, {"hour": 8, "rate": 25},
        {"hour": 9, "rate": 25}, {"hour": 10, "rate": 28}, {"hour": 11, "rate": 28},
        {"hour": 12, "rate": 30}, {"hour": 13, "rate": 30}, {"hour": 14, "rate": 35},
        {"hour": 15, "rate": 35}, {"hour": 16, "rate": 40}, {"hour": 17, "rate": 45},
        {"hour": 18, "rate": 50}, {"hour": 19, "rate": 50}, {"hour": 20, "rate": 45},
        {"hour": 21, "rate": 40}, {"hour": 22, "rate": 30}, {"hour": 23, "rate": 25}
    ]
}

# Test the API
try:
    response = requests.post('http://localhost:5000/api/optimize', json=test_data)
    if response.status_code == 200:
        result = response.json()
        print("✅ Backend is working!")
        print(f"Baseline cost: PKR {result['baseline']['cost']:.2f}")
        print(f"\nOptimization Results:")
        for i, opt in enumerate(result['results'], 1):
            labels = ["Most Optimized", "Moderately Optimized", "Least Optimized"]
            print(f"\n{labels[i-1]}:")
            print(f"  Cost: PKR {opt['costAfter']:.2f}")
            print(f"  Savings: PKR {opt['savings']:.2f} ({opt['savingsPercentage']:.2f}%)")
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to backend. Make sure Flask server is running on http://localhost:5000")
except Exception as e:
    print(f"❌ Error: {e}")

