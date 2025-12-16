import csv
import random
import numpy as np

# ============================================================
# 1. USER INPUT
# ============================================================
def get_user_loads():
    loads = {}
    essential = set()
    min_on_hours = {}

    count = int(input("Enter number of appliances: "))

    for i in range(count):
        name = input(f"Enter name of appliance {i+1}: ")
        power = float(input(f"Enter power rating of {name} (Watts): "))

        if input(f"Is {name} essential? (y/n): ").lower() == "y":
            essential.add(name)
            min_on_hours[name] = 24
        else:
            min_on_hours[name] = int(input(f"Minimum ON hours per day for {name}: "))

        loads[name] = power

    return loads, essential, min_on_hours

LOAD_POWER, ESSENTIAL_LOADS, MIN_ON_HOURS = get_user_loads()
LOAD_NAMES = list(LOAD_POWER.keys())
n_loads = len(LOAD_NAMES)

# ============================================================
# 2. TARIFF DATA
# ============================================================
def load_tariff_data(path):
    prices = [0] * 24
    with open(path, "r") as f:
        reader = csv.DictReader(f)
        for r in reader:
            prices[int(r["hour"])] = float(r["price"])
    peak = [i for i, p in enumerate(prices) if p == max(prices)]
    return prices, peak

hourly_price, peak_hours = load_tariff_data("tarrif.csv")

# ============================================================
# 3. COST FUNCTION
# ============================================================
def calculate_cost(schedule):
    return sum(
        (sum(schedule[h][i] * LOAD_POWER[LOAD_NAMES[i]] for i in range(n_loads)) / 1000)
        * hourly_price[h]
        for h in range(24)
    )

# ============================================================
# 4. REPAIR FUNCTION (Cost-aware)
# ============================================================
def repair_schedule(schedule):
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            for h in range(24):
                schedule[h][i] = 1
            continue

        needed = MIN_ON_HOURS[name]
        current = sum(schedule[h][i] for h in range(24))

        if current < needed:
            # Sort hours by price (cheapest first), excluding peak hours when possible
            hours_with_price = [(h, hourly_price[h]) for h in range(24) if schedule[h][i] == 0]
            # Prefer non-peak hours
            non_peak = [(h, p) for h, p in hours_with_price if h not in peak_hours]
            peak = [(h, p) for h, p in hours_with_price if h in peak_hours]
            
            # Sort by price
            non_peak.sort(key=lambda x: x[1])
            peak.sort(key=lambda x: x[1])
            
            # Use non-peak hours first, then peak if necessary
            hours_to_use = [h for h, _ in non_peak] + [h for h, _ in peak]
            
            for h in hours_to_use:
                if current >= needed:
                    break
                schedule[h][i] = 1
                current += 1
                
        # If we have too many hours, remove from expensive hours first
        elif current > needed:
            # Find hours that are ON and sort by price (expensive first)
            on_hours = [(h, hourly_price[h]) for h in range(24) if schedule[h][i] == 1]
            on_hours.sort(key=lambda x: x[1], reverse=True)
            
            # Remove from most expensive hours first
            for h, _ in on_hours:
                if current <= needed:
                    break
                schedule[h][i] = 0
                current -= 1
                
    return schedule

# ============================================================
# 5. GAPSO OPTIMIZED SCHEDULES
# ============================================================
def random_schedule():
    sch = []
    for h in range(24):
        row = []
        for name in LOAD_NAMES:
            if name in ESSENTIAL_LOADS:
                row.append(1)
            elif h in peak_hours:
                row.append(0)
            else:
                # Bias towards cheaper hours
                prob_on = 0.7 if hourly_price[h] < np.mean(hourly_price) else 0.3
                row.append(1 if random.random() < prob_on else 0)
        sch.append(row)
    return repair_schedule(sch)

def crossover(a, b):
    p = random.randint(1, 23)
    return repair_schedule(a[:p] + b[p:])

def mutation(s, rate=0.1):
    for h in range(24):
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS or h in peak_hours:
                continue
            if random.random() < rate:
                s[h][i] ^= 1
    return repair_schedule(s)

def pso_update(p, pb, gb, w=0.5, c1=1.5, c2=1.5):
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
                
            # Binary PSO: probability-based update
            # If pbest or gbest suggests ON, increase probability
            prob_on = 0.0
            if pb[h][i] == 1:
                prob_on += c1 * random.random()
            if gb[h][i] == 1:
                prob_on += c2 * random.random()
            if p[h][i] == 1:
                prob_on += w * random.random()
            
            # Normalize probability
            prob_on = min(prob_on / (w + c1 + c2), 1.0)
            
            # Also consider price: prefer cheaper hours
            price_factor = 1.0 - (hourly_price[h] / max(hourly_price))
            prob_on = prob_on * 0.7 + price_factor * 0.3
            
            if random.random() < prob_on:
                row[i] = 1
            else:
                row[i] = 0
        new.append(row)
    return repair_schedule(new)

def greedy_improve(schedule, max_iterations=10):
    """Local search: try moving loads to cheaper hours"""
    improved = True
    iteration = 0
    
    while improved and iteration < max_iterations:
        improved = False
        iteration += 1
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
                
            # Find hours where this load is ON
            on_hours = [h for h in range(24) if schedule[h][i] == 1]
            # Find hours where this load is OFF (and not peak)
            off_hours = [h for h in range(24) if schedule[h][i] == 0 and h not in peak_hours]
            
            if not on_hours or not off_hours:
                continue
            
            # Try moving from expensive ON hour to cheap OFF hour
            on_hours.sort(key=lambda h: hourly_price[h], reverse=True)
            off_hours.sort(key=lambda h: hourly_price[h])
            
            for h_on in on_hours:
                for h_off in off_hours:
                    if hourly_price[h_off] < hourly_price[h_on]:
                        # Try the swap
                        schedule[h_on][i] = 0
                        schedule[h_off][i] = 1
                        
                        # Check if still valid
                        current_on = sum(schedule[h][i] for h in range(24))
                        if current_on >= MIN_ON_HOURS[name]:
                            improved = True
                            break
                        else:
                            # Revert
                            schedule[h_on][i] = 1
                            schedule[h_off][i] = 0
                if improved:
                    break
    
    return schedule

def greedy_schedule():
    """Create a greedy initial schedule"""
    sch = [[0]*n_loads for _ in range(24)]
    
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            for h in range(24):
                sch[h][i] = 1
            continue
        
        needed = MIN_ON_HOURS[name]
        # Sort hours by price (cheapest first), avoid peak when possible
        hours_with_price = [(h, hourly_price[h]) for h in range(24)]
        non_peak = [(h, p) for h, p in hours_with_price if h not in peak_hours]
        peak = [(h, p) for h, p in hours_with_price if h in peak_hours]
        
        non_peak.sort(key=lambda x: x[1])
        peak.sort(key=lambda x: x[1])
        
        # Fill cheapest hours first
        for h, _ in non_peak[:needed]:
            sch[h][i] = 1
        # If still need more, use cheapest peak hours
        remaining = needed - len(non_peak[:needed])
        if remaining > 0:
            for h, _ in peak[:remaining]:
                sch[h][i] = 1
    
    return sch

def create_suboptimal_schedule(base_schedule, optimization_level):
    """Create a schedule with intentional sub-optimality for different optimization levels"""
    new_schedule = [row[:] for row in base_schedule]
    
    # Get price thresholds
    prices_sorted = sorted(hourly_price)
    low_price_threshold = prices_sorted[len(prices_sorted)//3]  # Bottom third
    mid_price_threshold = prices_sorted[2*len(prices_sorted)//3]  # Top third
    
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            continue
        
        needed = MIN_ON_HOURS[name]
        current_on = [h for h in range(24) if new_schedule[h][i] == 1]
        
        if optimization_level == "moderate":
            # Move 20-30% of loads to slightly more expensive (but still reasonable) hours
            num_to_move = max(1, int(needed * 0.25))
            # Find expensive hours that are currently ON
            expensive_on = [h for h in current_on if hourly_price[h] > low_price_threshold and h not in peak_hours]
            # Find cheaper hours that are currently OFF
            cheap_off = [h for h in range(24) if new_schedule[h][i] == 0 and 
                        hourly_price[h] <= mid_price_threshold and h not in peak_hours]
            
            expensive_on.sort(key=lambda h: hourly_price[h], reverse=True)
            cheap_off.sort(key=lambda h: hourly_price[h])
            
            moved = 0
            for h_exp in expensive_on[:num_to_move]:
                if moved >= num_to_move:
                    break
                # Find a moderately priced hour to move to (not the cheapest)
                for h_cheap in cheap_off:
                    if hourly_price[h_cheap] > hourly_price[h_exp] * 0.8:  # Allow slightly more expensive
                        new_schedule[h_exp][i] = 0
                        new_schedule[h_cheap][i] = 1
                        moved += 1
                        break
                        
        elif optimization_level == "least":
            # Move 30-40% of loads to moderately expensive hours
            num_to_move = max(1, int(needed * 0.35))
            # Find cheap hours that are currently ON
            cheap_on = [h for h in current_on if hourly_price[h] <= low_price_threshold]
            # Find moderately expensive hours that are currently OFF (but not peak)
            mid_off = [h for h in range(24) if new_schedule[h][i] == 0 and 
                      hourly_price[h] > low_price_threshold and 
                      hourly_price[h] < max(hourly_price) * 0.8 and h not in peak_hours]
            
            cheap_on.sort(key=lambda h: hourly_price[h])
            mid_off.sort(key=lambda h: hourly_price[h])
            
            moved = 0
            for h_cheap in cheap_on[:num_to_move]:
                if moved >= num_to_move or not mid_off:
                    break
                # Move to a moderately expensive hour
                h_mid = mid_off.pop(0)
                new_schedule[h_cheap][i] = 0
                new_schedule[h_mid][i] = 1
                moved += 1
    
    return repair_schedule(new_schedule)

def gapso_multi(iterations=None, pop_size=None, k=3):
    # Scale parameters based on problem size
    if iterations is None:
        iterations = max(100, 20 * n_loads)
    if pop_size is None:
        pop_size = max(20, 5 * n_loads)
    
    # Initialize population with mix of random and greedy solutions
    pop = []
    # Add one greedy solution
    pop.append(greedy_schedule())
    # Add rest as random
    pop.extend([random_schedule() for _ in range(pop_size - 1)])
    
    pbest = [s[:] for s in pop]  # Deep copy
    costs = [calculate_cost(p) for p in pop]
    archive = []

    for iteration in range(iterations):
        gbest_idx = costs.index(min(costs))
        gbest = pbest[gbest_idx]
        new_pop = []

        for i, ind in enumerate(pop):
            # PSO update with adaptive inertia
            w = 0.9 - (0.5 * iteration / iterations)  # Decreasing inertia
            c1 = pso_update(ind, pbest[i], gbest, w=w)
            # GA operations
            c2 = mutation(crossover(ind, random.choice(pop)))
            
            # Choose better child
            cost_c1 = calculate_cost(c1)
            cost_c2 = calculate_cost(c2)
            child = c1 if cost_c1 < cost_c2 else c2
            
            # Greedy improvement - apply less frequently to maintain diversity
            if iteration % 15 == 0 and i % 3 == 0:  # Apply to 1/3 of population
                child = greedy_improve(child)

            new_pop.append(child)
            c_cost = calculate_cost(child)

            if c_cost < costs[i]:
                pbest[i] = [row[:] for row in child]  # Deep copy
                costs[i] = c_cost

            # Archive: keep all solutions for diversity
            archive.append({"schedule": [row[:] for row in child], "cost": c_cost})

        pop = new_pop
        
        # Prune archive periodically but keep a wider range
        if len(archive) > k * 10:
            archive.sort(key=lambda x: x["cost"])
            # Keep top 60% to maintain diversity
            archive = archive[:int(len(archive) * 0.6)]

    # Sort archive by cost
    archive.sort(key=lambda x: x["cost"])
    
    # Remove duplicates (similar schedules) - more lenient threshold
    unique_archive = []
    for item in archive:
        is_duplicate = False
        for existing in unique_archive:
            # Calculate difference more accurately
            diff = sum(sum(abs(item["schedule"][h][i] - existing["schedule"][h][i]) 
                          for i in range(n_loads)) for h in range(24))
            # More lenient: allow schedules that differ by at least 5% of total slots
            threshold = max(5, (24 * n_loads) * 0.05)
            if diff < threshold:
                is_duplicate = True
                break
        if not is_duplicate:
            unique_archive.append(item)
        # Keep more candidates for final selection
        if len(unique_archive) >= k * 5:
            break
    
    # Get baseline cost for comparison
    baseline = generate_single_baseline()
    baseline_cost = baseline["cost"]
    
    # Create 3 distinct optimization levels
    results = []
    
    if len(unique_archive) >= 1:
        # MOST OPTIMIZED: Best solution with full greedy improvement
        best = {"schedule": [row[:] for row in unique_archive[0]["schedule"]], 
                "cost": unique_archive[0]["cost"]}
        best["schedule"] = greedy_improve(best["schedule"], max_iterations=20)
        best["schedule"] = greedy_improve(best["schedule"], max_iterations=20)  # Double pass
        best["cost"] = calculate_cost(best["schedule"])
        results.append(best)
        
        # MODERATE OPTIMIZED: Take best solution and move some loads to moderately priced hours (25-30 PKR)
        moderate = {"schedule": [row[:] for row in best["schedule"]], "cost": 0}
        
        # Move some loads from cheapest hours (20 PKR) to moderate hours (25-30 PKR)
        moderate_hours = [h for h in range(24) if 25 <= hourly_price[h] <= 30 and h not in peak_hours]
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
            
            needed = MIN_ON_HOURS[name]
            on_hours = [h for h in range(24) if moderate["schedule"][h][i] == 1]
            # Find cheapest hours (20-22 PKR) that are ON
            cheap_on = [h for h in on_hours if hourly_price[h] <= 22]
            cheap_on.sort(key=lambda h: hourly_price[h])
            
            # Move 30-40% of loads to moderate hours
            num_to_move = max(1, int(needed * 0.35))
            moved = 0
            
            for h_cheap in cheap_on[:num_to_move]:
                if moved >= num_to_move or not moderate_hours:
                    break
                # Find a moderate hour that's currently OFF
                for h_mod in moderate_hours:
                    if moderate["schedule"][h_mod][i] == 0:
                        moderate["schedule"][h_cheap][i] = 0
                        moderate["schedule"][h_mod][i] = 1
                        moved += 1
                        break
        
        moderate["schedule"] = repair_schedule(moderate["schedule"])
        moderate["cost"] = calculate_cost(moderate["schedule"])
        results.append(moderate)
        
        # LEAST OPTIMIZED: Take best solution and move more loads to more expensive hours (30-40 PKR)
        least = {"schedule": [row[:] for row in best["schedule"]], "cost": 0}
        
        # Move some loads to more expensive hours (30-40 PKR, but not peak)
        expensive_hours = [h for h in range(24) if 30 <= hourly_price[h] <= 40 and h not in peak_hours]
        
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
            
            needed = MIN_ON_HOURS[name]
            on_hours = [h for h in range(24) if least["schedule"][h][i] == 1]
            # Find cheap hours (20-25 PKR) that are ON
            cheap_on = [h for h in on_hours if hourly_price[h] <= 25]
            cheap_on.sort(key=lambda h: hourly_price[h])
            
            # Move 50-60% of loads to expensive hours
            num_to_move = max(1, int(needed * 0.55))
            moved = 0
            used_exp_hours = []
            
            for h_cheap in cheap_on[:num_to_move]:
                if moved >= num_to_move or not expensive_hours:
                    break
                # Find an expensive hour that's currently OFF
                for h_exp in expensive_hours:
                    if least["schedule"][h_exp][i] == 0 and h_exp not in used_exp_hours:
                        least["schedule"][h_cheap][i] = 0
                        least["schedule"][h_exp][i] = 1
                        used_exp_hours.append(h_exp)
                        moved += 1
                        break
        
        # Repair but don't let it move loads back from expensive to cheap
        # Only repair if minimum hours not met
        for i, name in enumerate(LOAD_NAMES):
            if name in ESSENTIAL_LOADS:
                continue
            needed = MIN_ON_HOURS[name]
            current = sum(least["schedule"][h][i] for h in range(24))
            if current < needed:
                # Only add from moderately priced hours, not cheapest
                hours_with_price = [(h, hourly_price[h]) for h in range(24) if least["schedule"][h][i] == 0]
                # Prefer hours 25-30 PKR range
                moderate = [(h, p) for h, p in hours_with_price if 25 <= p <= 30 and h not in peak_hours]
                moderate.sort(key=lambda x: x[1])
                # If not enough, use any non-peak
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
        
    else:
        # Fallback: create from greedy schedule
        best_sch = greedy_schedule()
        best_sch = greedy_improve(best_sch, max_iterations=20)
        best_sch = greedy_improve(best_sch, max_iterations=20)
        results.append({"schedule": best_sch, "cost": calculate_cost(best_sch)})
        
        moderate_sch = greedy_schedule()
        moderate_sch = greedy_improve(moderate_sch, max_iterations=5)
        results.append({"schedule": moderate_sch, "cost": calculate_cost(moderate_sch)})
        
        least_sch = greedy_schedule()
        least_sch = greedy_improve(least_sch, max_iterations=2)
        results.append({"schedule": least_sch, "cost": calculate_cost(least_sch)})
    
    # Ensure all are better than baseline and are actually different
    final_results = []
    for r in results:
        # If worse than baseline, improve it
        if r["cost"] >= baseline_cost:
            r["schedule"] = greedy_improve(r["schedule"], max_iterations=15)
            r["cost"] = calculate_cost(r["schedule"])
        
        # Check if different from existing results
        is_different = True
        for existing in final_results:
            diff = sum(sum(abs(r["schedule"][h][i] - existing["schedule"][h][i]) 
                          for i in range(n_loads)) for h in range(24))
            if diff < (24 * n_loads * 0.15):  # Less than 15% different
                is_different = False
                break
        
        if is_different:
            final_results.append(r)
        elif len(final_results) < k:
            # If too similar, try to create a variation
            variant = {"schedule": [row[:] for row in r["schedule"]], "cost": r["cost"]}
            # Make some random changes
            for _ in range(n_loads * 4):
                h = random.randint(0, 23)
                i = random.randint(0, n_loads - 1)
                if LOAD_NAMES[i] not in ESSENTIAL_LOADS and h not in peak_hours:
                    variant["schedule"][h][i] = 1 - variant["schedule"][h][i]
            variant["schedule"] = repair_schedule(variant["schedule"])
            variant["cost"] = calculate_cost(variant["schedule"])
            
            is_variant_different = True
            for existing in final_results:
                diff = sum(sum(abs(variant["schedule"][h][i] - existing["schedule"][h][i]) 
                              for i in range(n_loads)) for h in range(24))
                if diff < (24 * n_loads * 0.15):
                    is_variant_different = False
                    break
            
            if is_variant_different and variant["cost"] < baseline_cost:
                final_results.append(variant)
    
    # Sort by cost to ensure: most optimized, moderate, least optimized
    final_results.sort(key=lambda x: x["cost"])
    
    # Ensure we have exactly k results
    while len(final_results) < k:
        # Create additional variations if needed
        if len(final_results) > 0:
            base = final_results[-1]  # Use least optimized as base
        else:
            base = {"schedule": greedy_schedule(), "cost": calculate_cost(greedy_schedule())}
        
        variant = {"schedule": [row[:] for row in base["schedule"]], "cost": base["cost"]}
        # Make significant random changes
        for _ in range(n_loads * 6):
            h = random.randint(0, 23)
            i = random.randint(0, n_loads - 1)
            if LOAD_NAMES[i] not in ESSENTIAL_LOADS and h not in peak_hours:
                variant["schedule"][h][i] = 1 - variant["schedule"][h][i]
        variant["schedule"] = repair_schedule(variant["schedule"])
        variant["schedule"] = greedy_improve(variant["schedule"], max_iterations=3)
        variant["cost"] = calculate_cost(variant["schedule"])
        
        if variant["cost"] < baseline_cost:
            final_results.append(variant)
        else:
            break
    
    return final_results[:k]

# ============================================================
# 6. SINGLE BASELINE (UNOPTIMIZED)
# ============================================================
REALISTIC_WINDOWS = {
    "Microwave": list(range(9, 10)) + list(range(20, 21)),
    "Fan": list(range(22, 24)) + list(range(0, 6)),
    "AC": list(range(13, 17)) + list(range(22, 24)),
    "WashingMachine": list(range(9, 17)),
    "Iron": list(range(7, 10))
}

def generate_single_baseline():
    sch = [[0]*n_loads for _ in range(24)]
    for i, name in enumerate(LOAD_NAMES):
        if name in ESSENTIAL_LOADS:
            for h in range(24):
                sch[h][i] = 1
            continue

        hrs = REALISTIC_WINDOWS.get(name, list(range(24)))
        random.shuffle(hrs)
        used = 0
        for h in hrs:
            if used < MIN_ON_HOURS[name]:
                sch[h][i] = 1
                used += 1
        h = 0
        while used < MIN_ON_HOURS[name]:
            if sch[h][i] == 0:
                sch[h][i] = 1
                used += 1
            h += 1
    cost = calculate_cost(sch)
    return {"schedule": sch, "cost": cost}

# ============================================================
# 7. PRINT SCHEDULE
# ============================================================
def print_schedule(title, sch, cost):
    print(f"\n{title}")
    print(f"Total Cost: {cost:.2f} PKR")
    print("Hour | " + " | ".join(LOAD_NAMES))
    print("-" * (7 + 4*n_loads))
    for h in range(24):
        print(f"{h:02d}   | " + " | ".join(str(x) for x in sch[h]))

# ============================================================
# 8. RUN & COMPARE
# ============================================================
baseline = generate_single_baseline()
opt = gapso_multi(k=3)

# Label the options appropriately
opt_labels = ["Most Optimized", "Moderately Optimized", "Least Optimized (but still better than baseline)"]

print("\n========= OPTIMIZED SCHEDULES =========")
for i, o in enumerate(opt):
    label = opt_labels[i] if i < len(opt_labels) else f"Optimized Option {i+1}"
    print_schedule(label, o["schedule"], o["cost"])

print("\n========= BASELINE SCHEDULE =========")
print_schedule("Single Baseline", baseline["schedule"], baseline["cost"])

# ============================================================
# 9. PER-SCHEDULE COST COMPARISON
# ============================================================
print("\n========= PER-SCHEDULE COST COMPARISON =========")
print("Option | Baseline Cost | Optimized Cost | Cost Saved | Saving (%)")
print("-" * 65)

for i in range(len(opt)):
    b = baseline["cost"]
    o = opt[i]["cost"]
    saved = b - o
    pct = (saved / b) * 100 if b > 0 else 0
    label = opt_labels[i] if i < len(opt_labels) else f"Option {i+1}"
    print(f"{label[:6]:^6} | {b:^13.2f} | {o:^14.2f} | {saved:^10.2f} | {pct:^9.2f}")
