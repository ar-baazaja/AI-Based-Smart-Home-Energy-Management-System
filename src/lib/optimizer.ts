import { Appliance, TariffRate, OptimizationResult, ScheduleCell, OptimizationResponse } from '@/types/scheduler';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Health check function to test backend connection
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

// Call backend API for optimization
export async function optimizeSchedule(
  appliances: Appliance[],
  tariffRates: TariffRate[],
  iterations: number = 100,
  populationSize: number = 50
): Promise<OptimizationResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appliances: appliances.map(app => ({
          id: app.id,
          name: app.name,
          wattage: app.wattage,
          isEssential: app.isEssential,
          hours: app.hours,
        })),
        tariffRates: tariffRates.map(rate => ({
          hour: rate.hour,
          rate: rate.rate,
          isPeak: rate.isPeak,
        })),
        iterations,
        populationSize,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `API error: ${response.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: OptimizationResponse = await response.json();
    
    if (!data.success) {
      throw new Error('Optimization failed: Invalid response from server');
    }
    
    return data;
  } catch (error: any) {
    console.error('Optimization error:', error);
    
    // Provide more helpful error messages
    if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
      throw new Error('Cannot connect to backend server. Please ensure the Flask server is running on http://localhost:5000');
    }
    
    throw error;
  }
}

// Legacy client-side optimizer (kept for fallback, but not used)
export function optimizeScheduleLegacy(
  appliances: Appliance[],
  tariffRates: TariffRate[],
  iterations: number = 100,
  populationSize: number = 50
): OptimizationResult {
  // Calculate original cost
  const originalSchedule = createOriginalSchedule(appliances);
  const costBefore = calculateCost(originalSchedule, appliances, tariffRates);

  // Separate essential and non-essential appliances
  const essentialAppliances = appliances.filter(a => a.isEssential);
  const nonEssentialAppliances = appliances.filter(a => !a.isEssential);

  // Initialize population
  let population = initializePopulation(nonEssentialAppliances, populationSize, tariffRates);

  // Run GA-PSO hybrid optimization
  for (let iter = 0; iter < iterations; iter++) {
    // Evaluate fitness
    const fitness = population.map(individual => 
      evaluateFitness(individual, essentialAppliances, appliances, tariffRates)
    );

    // Selection and crossover (GA)
    population = geneticOperations(population, fitness);

    // Particle swarm update (PSO)
    population = particleSwarmUpdate(population, fitness, tariffRates);
  }

  // Get best solution
  const fitness = population.map(individual => 
    evaluateFitness(individual, essentialAppliances, appliances, tariffRates)
  );
  const bestIndex = fitness.indexOf(Math.min(...fitness));
  const bestSchedule = population[bestIndex];

  // Create final schedule
  const optimizedSchedule = createFinalSchedule(bestSchedule, essentialAppliances, appliances);
  const costAfter = calculateCost(optimizedSchedule, appliances, tariffRates);
  const savings = costBefore - costAfter;
  const savingsPercentage = (savings / costBefore) * 100;

  return {
    schedule: convertToScheduleCells(optimizedSchedule, appliances),
    costBefore,
    costAfter,
    savings,
    savingsPercentage
  };
}

function createOriginalSchedule(appliances: Appliance[]): boolean[][] {
  const schedule: boolean[][] = Array(24).fill(null).map(() => 
    Array(appliances.length).fill(false)
  );

  appliances.forEach((appliance, appIndex) => {
    appliance.hours.forEach(hour => {
      schedule[hour][appIndex] = true;
    });
  });

  return schedule;
}

function calculateCost(schedule: boolean[][], appliances: Appliance[], tariffRates: TariffRate[]): number {
  let totalCost = 0;

  for (let hour = 0; hour < 24; hour++) {
    const rate = tariffRates.find(r => r.hour === hour)?.rate || 0;
    let hourlyPower = 0;

    schedule[hour].forEach((isOn, appIndex) => {
      if (isOn) {
        hourlyPower += appliances[appIndex].wattage;
      }
    });

    totalCost += (hourlyPower / 1000) * rate; // Convert watts to kW
  }

  return totalCost;
}

function initializePopulation(
  nonEssentialAppliances: Appliance[],
  populationSize: number,
  tariffRates: TariffRate[]
): boolean[][][] {
  const population: boolean[][][] = [];

  for (let i = 0; i < populationSize; i++) {
    const individual: boolean[][] = Array(24).fill(null).map(() => 
      Array(nonEssentialAppliances.length).fill(false)
    );

    nonEssentialAppliances.forEach((appliance, appIndex) => {
      const requiredHours = appliance.hours.length;
      const availableHours = Array.from({ length: 24 }, (_, i) => i);
      
      // Bias towards off-peak hours
      const sortedHours = availableHours.sort((a, b) => {
        const rateA = tariffRates.find(r => r.hour === a)?.rate || 0;
        const rateB = tariffRates.find(r => r.hour === b)?.rate || 0;
        return rateA - rateB;
      });

      // Select hours with some randomness
      const selectedHours = sortedHours
        .slice(0, Math.min(requiredHours * 2, 24))
        .sort(() => Math.random() - 0.5)
        .slice(0, requiredHours);

      selectedHours.forEach(hour => {
        individual[hour][appIndex] = true;
      });
    });

    population.push(individual);
  }

  return population;
}

function evaluateFitness(
  individual: boolean[][],
  essentialAppliances: Appliance[],
  allAppliances: Appliance[],
  tariffRates: TariffRate[]
): number {
  const fullSchedule = createFinalSchedule(individual, essentialAppliances, allAppliances);
  return calculateCost(fullSchedule, allAppliances, tariffRates);
}

function geneticOperations(population: boolean[][][], fitness: number[]): boolean[][][] {
  const newPopulation: boolean[][][] = [];
  const tournamentSize = 3;

  while (newPopulation.length < population.length) {
    // Tournament selection
    const parent1 = tournamentSelection(population, fitness, tournamentSize);
    const parent2 = tournamentSelection(population, fitness, tournamentSize);

    // Crossover
    const [child1, child2] = crossover(parent1, parent2);

    // Mutation
    newPopulation.push(mutate(child1));
    if (newPopulation.length < population.length) {
      newPopulation.push(mutate(child2));
    }
  }

  return newPopulation;
}

function tournamentSelection(population: boolean[][][], fitness: number[], tournamentSize: number): boolean[][] {
  let best = Math.floor(Math.random() * population.length);
  let bestFitness = fitness[best];

  for (let i = 1; i < tournamentSize; i++) {
    const candidate = Math.floor(Math.random() * population.length);
    if (fitness[candidate] < bestFitness) {
      best = candidate;
      bestFitness = fitness[candidate];
    }
  }

  return population[best];
}

function crossover(parent1: boolean[][], parent2: boolean[][]): [boolean[][], boolean[][]] {
  const crossoverPoint = Math.floor(Math.random() * 24);
  
  const child1 = parent1.map((hour, i) => 
    i < crossoverPoint ? [...hour] : [...parent2[i]]
  );
  
  const child2 = parent2.map((hour, i) => 
    i < crossoverPoint ? [...hour] : [...parent1[i]]
  );

  return [child1, child2];
}

function mutate(individual: boolean[][]): boolean[][] {
  const mutationRate = 0.1;
  const mutated = individual.map(hour => [...hour]);

  for (let hour = 0; hour < 24; hour++) {
    for (let app = 0; app < mutated[hour].length; app++) {
      if (Math.random() < mutationRate) {
        mutated[hour][app] = !mutated[hour][app];
      }
    }
  }

  return mutated;
}

function particleSwarmUpdate(
  population: boolean[][][],
  fitness: number[],
  tariffRates: TariffRate[]
): boolean[][][] {
  const bestGlobalIndex = fitness.indexOf(Math.min(...fitness));
  const bestGlobal = population[bestGlobalIndex];

  return population.map((individual, idx) => {
    const updated = individual.map(hour => [...hour]);

    // Move towards global best with probability
    for (let hour = 0; hour < 24; hour++) {
      const rate = tariffRates.find(r => r.hour === hour)?.rate || 0;
      const isPeakHour = tariffRates.find(r => r.hour === hour)?.isPeak || false;

      for (let app = 0; app < updated[hour].length; app++) {
        // Higher probability to follow best solution during peak hours
        const followProbability = isPeakHour ? 0.7 : 0.3;
        
        if (Math.random() < followProbability) {
          updated[hour][app] = bestGlobal[hour][app];
        }
      }
    }

    return updated;
  });
}

function createFinalSchedule(
  nonEssentialSchedule: boolean[][],
  essentialAppliances: Appliance[],
  allAppliances: Appliance[]
): boolean[][] {
  const schedule: boolean[][] = Array(24).fill(null).map(() => 
    Array(allAppliances.length).fill(false)
  );

  // Add essential appliances first
  essentialAppliances.forEach(appliance => {
    const appIndex = allAppliances.findIndex(a => a.id === appliance.id);
    appliance.hours.forEach(hour => {
      schedule[hour][appIndex] = true;
    });
  });

  // Add non-essential appliances
  const nonEssentialAppliances = allAppliances.filter(a => !a.isEssential);
  for (let hour = 0; hour < 24; hour++) {
    nonEssentialSchedule[hour].forEach((isOn, nonEssIndex) => {
      const appliance = nonEssentialAppliances[nonEssIndex];
      const appIndex = allAppliances.findIndex(a => a.id === appliance.id);
      schedule[hour][appIndex] = isOn;
    });
  }

  return schedule;
}

function convertToScheduleCells(schedule: boolean[][], appliances: Appliance[]): ScheduleCell[][] {
  return schedule.map((hourSchedule, hour) => [{
    hour,
    appliances: appliances.map((appliance, appIndex) => ({
      id: appliance.id,
      name: appliance.name,
      isEssential: appliance.isEssential,
      isOn: hourSchedule[appIndex]
    }))
  }]);
}

export function detectPeakHours(tariffRates: TariffRate[]): TariffRate[] {
  const sortedRates = [...tariffRates].sort((a, b) => b.rate - a.rate);
  const peakThreshold = sortedRates[Math.floor(sortedRates.length * 0.25)]?.rate || 0;

  return tariffRates.map(rate => ({
    ...rate,
    isPeak: rate.rate >= peakThreshold
  }));
}

export function parseTariffFile(content: string, fileType: 'csv' | 'json'): TariffRate[] {
  if (fileType === 'json') {
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  }

  // Parse CSV
  const lines = content.trim().split('\n');
  const rates: TariffRate[] = [];

  for (let i = 1; i < lines.length; i++) {
    const [hour, rate] = lines[i].split(',').map(s => s.trim());
    if (hour && rate) {
      rates.push({
        hour: parseInt(hour),
        rate: parseFloat(rate)
      });
    }
  }

  return rates;
}
