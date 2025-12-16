export interface Appliance {
  id: string;
  name: string;
  wattage: number;
  isEssential: boolean;
  hours: number[];
}

export interface TariffRate {
  hour: number;
  rate: number;
  isPeak?: boolean;
}

export interface OptimizationResult {
  schedule: ScheduleCell[][];
  costBefore: number;
  costAfter: number;
  savings: number;
  savingsPercentage: number;
}

export interface OptimizationResponse {
  success: boolean;
  baseline: {
    schedule: ScheduleCell[][];
    cost: number;
  };
  results: OptimizationResult[];
}

export interface ScheduleCell {
  hour: number;
  appliances: {
    id: string;
    name: string;
    isEssential: boolean;
    isOn: boolean;
  }[];
}

export interface OptimizationParams {
  iterations: number;
  populationSize: number;
}
