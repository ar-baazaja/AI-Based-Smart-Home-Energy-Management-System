from flask import Flask, request, jsonify
from flask_cors import CORS
import csv
import random
import numpy as np
import os
import tempfile
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Global variables (will be set from request)
LOAD_POWER = {}
ESSENTIAL_LOADS = set()
MIN_ON_HOURS = {}
LOAD_NAMES = []
n_loads = 0
hourly_price = []
peak_hours = []

def load_tariff_data_from_dict(tariff_rates):
    """Load tariff data from dictionary format"""
    prices = [0] * 24
    for rate in tariff_rates:
        hour = int(rate['hour'])
        price = float(rate['rate'])
        prices[hour] = price
    peak = [i for i, p in enumerate(prices) if p == max(prices)]
    return prices, peak

def calculate_cost(schedule):
    """Calculate total cost of schedule"""
    return sum(
        (sum(schedule[h][i] * LOAD_POWER[LOAD_NAMES[i]] for i in range(n_loads)) / 1000)
        * hourly_price[h]
        for h in range(24)
    )

def repair_schedule(schedule):
    """Repair schedule to meet minimum hour requirements"""
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            for h in range(24):
                schedule[h][i] = 1
            continue

        needed = MIN_ON_HOURS[name]
        current = sum(schedule[h][i] for h in range(24))

        if current < needed:
            hours_with_price = [(h, hourly_price[h]) for h in range(24) if schedule[h][i] == 0]
            non_peak = [(h, p) for h, p in hours_with_price if h not in peak_hours]
            peak = [(h, p) for h, p in hours_with_price if h in peak_hours]
            
            non_peak.sort(key=lambda x: x[1])
            peak.sort(key=lambda x: x[1])
            
            hours_to_use = [h for h, _ in non_peak] + [h for h, _ in peak]
            
            for h in hours_to_use:
                if current >= needed:
                    break
                schedule[h][i] = 1
                current += 1
                
        elif current > needed:
            on_hours = [(h, hourly_price[h]) for h in range(24) if schedule[h][i] == 1]
            on_hours.sort(key=lambda x: x[1], reverse=True)
            
            for h, _ in on_hours:
                if current <= needed:
                    break
                schedule[h][i] = 0
                current -= 1
                
    return schedule

def random_schedule():
    """Generate random initial schedule"""
    sch = []
    for h in range(24):
        row = []
        for name in LOAD_NAMES:
            if name in ESSENTIAL_LOADS:
                row.append(1)
            elif h in peak_hours:
                row.append(0)
            else:
                prob_on = 0.7 if hourly_price[h] < np.mean(hourly_price) else 0.3
                row.append(1 if random.random() < prob_on else 0)
        sch.append(row)
    return repair_schedule(sch)

def crossover(a, b):
    """Crossover operation"""
    p = random.randint(1, 23)
    return repair_schedule(a[:p] + b[p:])

def mutation(s, rate=0.1):
    """Mutation operation"""
    for h in range(24):
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS or h in peak_hours:
                continue
            if random.random() < rate:
                s[h][i] ^= 1
    return repair_schedule(s)

def pso_update(p, pb, gb, w=0.5, c1=1.5, c2=1.5):
    """PSO update operation"""
    new = []
    for h in range(24):
        row = p[h][:]
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                row[i] = 1
                continue
            if h in peak_hours:
                row[i] = 0
                continue
                
            prob_on = 0.0
            if pb[h][i] == 1:
                prob_on += c1 * random.random()
            if gb[h][i] == 1:
                prob_on += c2 * random.random()
            if p[h][i] == 1:
                prob_on += w * random.random()
            
            prob_on = min(prob_on / (w + c1 + c2), 1.0)
            
            price_factor = 1.0 - (hourly_price[h] / max(hourly_price))
            prob_on = prob_on * 0.7 + price_factor * 0.3
            
            if random.random() < prob_on:
                row[i] = 1
            else:
                row[i] = 0
        new.append(row)
    return repair_schedule(new)

def greedy_improve(schedule, max_iterations=10):
    """Local search improvement"""
    improved = True
    iteration = 0
    
    while improved and iteration < max_iterations:
        improved = False
        iteration += 1
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
                
            on_hours = [h for h in range(24) if schedule[h][i] == 1]
            off_hours = [h for h in range(24) if schedule[h][i] == 0 and h not in peak_hours]
            
            if not on_hours or not off_hours:
                continue
            
            on_hours.sort(key=lambda h: hourly_price[h], reverse=True)
            off_hours.sort(key=lambda h: hourly_price[h])
            
            for h_on in on_hours:
                for h_off in off_hours:
                    if hourly_price[h_off] < hourly_price[h_on]:
                        schedule[h_on][i] = 0
                        schedule[h_off][i] = 1
                        
                        current_on = sum(schedule[h][i] for h in range(24))
                        if current_on >= MIN_ON_HOURS[name]:
                            improved = True
                            break
                        else:
                            schedule[h_on][i] = 1
                            schedule[h_off][i] = 0
                if improved:
                    break
    
    return schedule

def greedy_schedule():
    """Create greedy initial schedule"""
    sch = [[0]*n_loads for _ in range(24)]
    
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            for h in range(24):
                sch[h][i] = 1
            continue
        
        needed = MIN_ON_HOURS[name]
        hours_with_price = [(h, hourly_price[h]) for h in range(24)]
        non_peak = [(h, p) for h, p in hours_with_price if h not in peak_hours]
        peak = [(h, p) for h, p in hours_with_price if h in peak_hours]
        
        non_peak.sort(key=lambda x: x[1])
        peak.sort(key=lambda x: x[1])
        
        for h, _ in non_peak[:needed]:
            sch[h][i] = 1
        remaining = needed - len(non_peak[:needed])
        if remaining > 0:
            for h, _ in peak[:remaining]:
                sch[h][i] = 1
    
    return sch

def gapso_optimize(iterations=None, pop_size=None, k=3):
    """Main GAPSO optimization function"""
    if iterations is None:
        iterations = max(100, 20 * n_loads)
    if pop_size is None:
        pop_size = max(20, 5 * n_loads)
    
    pop = []
    pop.append(greedy_schedule())
    pop.extend([random_schedule() for _ in range(pop_size - 1)])
    
    pbest = [s[:] for s in pop]
    costs = [calculate_cost(p) for p in pop]
    archive = []

    for iteration in range(iterations):
        gbest_idx = costs.index(min(costs))
        gbest = pbest[gbest_idx]
        new_pop = []

        for i, ind in enumerate(pop):
            w = 0.9 - (0.5 * iteration / iterations)
            c1 = pso_update(ind, pbest[i], gbest, w=w)
            c2 = mutation(crossover(ind, random.choice(pop)))
            
            cost_c1 = calculate_cost(c1)
            cost_c2 = calculate_cost(c2)
            child = c1 if cost_c1 < cost_c2 else c2
            
            if iteration % 15 == 0 and i % 3 == 0:
                child = greedy_improve(child)

            new_pop.append(child)
            c_cost = calculate_cost(child)

            if c_cost < costs[i]:
                pbest[i] = [row[:] for row in child]
                costs[i] = c_cost

            archive.append({"schedule": [row[:] for row in child], "cost": c_cost})

        pop = new_pop
        
        if len(archive) > k * 10:
            archive.sort(key=lambda x: x["cost"])
            archive = archive[:int(len(archive) * 0.6)]

    archive.sort(key=lambda x: x["cost"])
    
    unique_archive = []
    for item in archive:
        is_duplicate = False
        for existing in unique_archive:
            diff = sum(sum(abs(item["schedule"][h][i] - existing["schedule"][h][i]) 
                          for i in range(n_loads)) for h in range(24))
            threshold = max(5, (24 * n_loads) * 0.05)
            if diff < threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            unique_archive.append(item)
        if len(unique_archive) >= k * 5:
            break
    
    # Create 3 distinct optimization levels
    results = []
    
    if len(unique_archive) >= 1:
        # MOST OPTIMIZED
        best = {"schedule": [row[:] for row in unique_archive[0]["schedule"]], 
                "cost": unique_archive[0]["cost"]}
        best["schedule"] = greedy_improve(best["schedule"], max_iterations=20)
        best["schedule"] = greedy_improve(best["schedule"], max_iterations=20)
        best["cost"] = calculate_cost(best["schedule"])
        results.append(best)
        
        # MODERATE OPTIMIZED
        moderate = {"schedule": [row[:] for row in best["schedule"]], "cost": 0}
        moderate_hours = [h for h in range(24) if 25 <= hourly_price[h] <= 30 and h not in peak_hours]
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
            
            needed = MIN_ON_HOURS[name]
            on_hours = [h for h in range(24) if moderate["schedule"][h][i] == 1]
            cheap_on = [h for h in on_hours if hourly_price[h] <= 22]
            cheap_on.sort(key=lambda h: hourly_price[h])
            
            num_to_move = max(1, int(needed * 0.35))
            moved = 0
            
            for h_cheap in cheap_on[:num_to_move]:
                if moved >= num_to_move or not moderate_hours:
                    break
                for h_mod in moderate_hours:
                    if moderate["schedule"][h_mod][i] == 0:
                        moderate["schedule"][h_cheap][i] = 0
                        moderate["schedule"][h_mod][i] = 1
                        moved += 1
                        break
        
        moderate["schedule"] = repair_schedule(moderate["schedule"])
        moderate["cost"] = calculate_cost(moderate["schedule"])
        results.append(moderate)
        
        # LEAST OPTIMIZED
        least = {"schedule": [row[:] for row in best["schedule"]], "cost": 0}
        expensive_hours = [h for h in range(24) if 30 <= hourly_price[h] <= 40 and h not in peak_hours]
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
            
            needed = MIN_ON_HOURS[name]
            on_hours = [h for h in range(24) if least["schedule"][h][i] == 1]
            cheap_on = [h for h in on_hours if hourly_price[h] <= 25]
            cheap_on.sort(key=lambda h: hourly_price[h])
            
            num_to_move = max(1, int(needed * 0.55))
            moved = 0
            used_exp_hours = []
            
            for h_cheap in cheap_on[:num_to_move]:
                if moved >= num_to_move or not expensive_hours:
                    break
                for h_exp in expensive_hours:
                    if least["schedule"][h_exp][i] == 0 and h_exp not in used_exp_hours:
                        least["schedule"][h_cheap][i] = 0
                        least["schedule"][h_exp][i] = 1
                        used_exp_hours.append(h_exp)
                        moved += 1
                        break
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
            needed = MIN_ON_HOURS[name]
            current = sum(least["schedule"][h][i] for h in range(24))
            if current < needed:
                hours_with_price = [(h, hourly_price[h]) for h in range(24) if least["schedule"][h][i] == 0]
                moderate = [(h, p) for h, p in hours_with_price if 25 <= p <= 30 and h not in peak_hours]
                moderate.sort(key=lambda x: x[1])
                if len(moderate) < (needed - current):
                    other = [(h, p) for h, p in hours_with_price if h not in peak_hours and (h, p) not in moderate]
                    other.sort(key=lambda x: x[1])
                    moderate.extend(other)
                
                for h, _ in moderate:
                    if current >= needed:
                        break
                    least["schedule"][h][i] = 1
                    current += 1
        
        least["cost"] = calculate_cost(least["schedule"])
        results.append(least)
    
    return results

def generate_baseline():
    """Generate baseline schedule"""
    sch = [[0]*n_loads for _ in range(24)]
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            for h in range(24):
                sch[h][i] = 1
            continue

        needed = MIN_ON_HOURS[name]
        hours = list(range(24))
        random.shuffle(hours)
        used = 0
        for h in hours:
            if used < needed:
                sch[h][i] = 1
                used += 1
    cost = calculate_cost(sch)
    return {"schedule": sch, "cost": cost}

def convert_schedule_to_frontend_format(schedule, appliances):
    """Convert backend schedule format to frontend format"""
    schedule_cells = []
    for hour in range(24):
        hour_data = [{
            "hour": hour,
            "appliances": [
                {
                    "id": appliances[i]["id"],
                    "name": appliances[i]["name"],
                    "isEssential": appliances[i]["isEssential"],
                    "isOn": bool(schedule[hour][i])
                }
                for i in range(len(appliances))
            ]
        }]
        schedule_cells.append(hour_data)
    return schedule_cells

@app.route('/api/optimize', methods=['POST'])
def optimize():
    """Main optimization endpoint"""
    try:
        data = request.json
        
        # Extract data
        appliances = data.get('appliances', [])
        tariff_rates = data.get('tariffRates', [])
        
        if not appliances or not tariff_rates:
            return jsonify({"error": "Missing appliances or tariff rates"}), 400
        
        # Set global variables
        global LOAD_POWER, ESSENTIAL_LOADS, MIN_ON_HOURS, LOAD_NAMES, n_loads, hourly_price, peak_hours
        
        LOAD_POWER = {}
        ESSENTIAL_LOADS = set()
        MIN_ON_HOURS = {}
        
        for app in appliances:
            name = app['name']
            LOAD_POWER[name] = float(app['wattage'])
            if app.get('isEssential', False):
                ESSENTIAL_LOADS.add(name)
                MIN_ON_HOURS[name] = 24
            else:
                # Calculate min hours from hours array (if provided)
                # Otherwise use a default minimum
                hours_array = app.get('hours', [])
                if hours_array and len(hours_array) > 0:
                    MIN_ON_HOURS[name] = len(hours_array)
                else:
                    # Default to 1 hour if no hours specified
                    MIN_ON_HOURS[name] = 1
        
        LOAD_NAMES = [app['name'] for app in appliances]
        n_loads = len(LOAD_NAMES)
        
        hourly_price, peak_hours = load_tariff_data_from_dict(tariff_rates)
        
        # Generate baseline
        baseline = generate_baseline()
        baseline_cost = baseline["cost"]
        
        # Run optimization
        opt_results = gapso_optimize(k=3)
        
        # Convert results to frontend format
        results = []
        for opt in opt_results:
            schedule = convert_schedule_to_frontend_format(opt["schedule"], appliances)
            results.append({
                "schedule": schedule,
                "costBefore": baseline_cost,
                "costAfter": opt["cost"],
                "savings": baseline_cost - opt["cost"],
                "savingsPercentage": ((baseline_cost - opt["cost"]) / baseline_cost * 100) if baseline_cost > 0 else 0
            })
        
        return jsonify({
            "success": True,
            "baseline": {
                "schedule": convert_schedule_to_frontend_format(baseline["schedule"], appliances),
                "cost": baseline_cost
            },
            "results": results
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')

