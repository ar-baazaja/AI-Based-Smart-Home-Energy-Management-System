import { useState, useEffect } from 'react';
import { Plus, Zap, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Appliance, TariffRate, OptimizationResult, OptimizationParams, OptimizationResponse } from '@/types/scheduler';
import { optimizeSchedule, checkBackendHealth } from '@/lib/optimizer';
import { Header } from './Header';
import { ApplianceCard } from './ApplianceCard';
import { TariffUpload } from './TariffUpload';
import { AdvancedSettings } from './AdvancedSettings';
import { OptimizationButton } from './OptimizationButton';
import { ResultsDashboard } from './ResultsDashboard';
import { ExplanationPanel } from './ExplanationPanel';

// Demo data for quick testing
const demoAppliances: Appliance[] = [
  { id: 'demo-1', name: 'Washing Machine', wattage: 2000, isEssential: false, hours: Array.from({ length: 3 }, (_, i) => i) }, // 3 hours minimum
  { id: 'demo-2', name: 'Air Conditioner', wattage: 1500, isEssential: false, hours: Array.from({ length: 6 }, (_, i) => i) }, // 6 hours minimum
  { id: 'demo-3', name: 'Refrigerator', wattage: 150, isEssential: true, hours: Array.from({ length: 24 }, (_, i) => i) }, // 24 hours (essential)
  { id: 'demo-4', name: 'Water Heater', wattage: 3000, isEssential: false, hours: Array.from({ length: 4 }, (_, i) => i) }, // 4 hours minimum
  { id: 'demo-5', name: 'Dishwasher', wattage: 1800, isEssential: false, hours: Array.from({ length: 2 }, (_, i) => i) }, // 2 hours minimum
];

const demoTariffRates: TariffRate[] = [
  { hour: 0, rate: 8, isPeak: false },
  { hour: 1, rate: 8, isPeak: false },
  { hour: 2, rate: 8, isPeak: false },
  { hour: 3, rate: 8, isPeak: false },
  { hour: 4, rate: 8, isPeak: false },
  { hour: 5, rate: 9, isPeak: false },
  { hour: 6, rate: 12, isPeak: false },
  { hour: 7, rate: 18, isPeak: false },
  { hour: 8, rate: 22, isPeak: true },
  { hour: 9, rate: 25, isPeak: true },
  { hour: 10, rate: 26, isPeak: true },
  { hour: 11, rate: 27, isPeak: true },
  { hour: 12, rate: 28, isPeak: true },
  { hour: 13, rate: 27, isPeak: true },
  { hour: 14, rate: 26, isPeak: true },
  { hour: 15, rate: 25, isPeak: true },
  { hour: 16, rate: 24, isPeak: false },
  { hour: 17, rate: 26, isPeak: true },
  { hour: 18, rate: 28, isPeak: true },
  { hour: 19, rate: 27, isPeak: true },
  { hour: 20, rate: 22, isPeak: false },
  { hour: 21, rate: 15, isPeak: false },
  { hour: 22, rate: 12, isPeak: false },
  { hour: 23, rate: 10, isPeak: false },
];

export function Scheduler() {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [tariffRates, setTariffRates] = useState<TariffRate[]>([]);
  const [optimizationParams, setOptimizationParams] = useState<OptimizationParams>({
    iterations: 100,
    populationSize: 50,
  });
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [optimizationResponse, setOptimizationResponse] = useState<OptimizationResponse | null>(null);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [totalWattage, setTotalWattage] = useState(0);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  // Calculate total wattage
  useEffect(() => {
    const total = appliances.reduce((sum, app) => sum + (app.wattage || 0), 0);
    setTotalWattage(total);
  }, [appliances]);

  // Check backend connection on mount
  useEffect(() => {
    checkBackendHealth().then(connected => {
      setBackendConnected(connected);
      if (!connected) {
        console.warn('Backend server not reachable. Please start the Flask server on http://localhost:5000');
      }
    });
  }, []);

  const loadDemoData = () => {
    setAppliances(demoAppliances);
    setTariffRates(demoTariffRates);
  };

  const addAppliance = () => {
    const newAppliance: Appliance = {
      id: `appliance-${Date.now()}`,
      name: '',
      wattage: 0,
      isEssential: false,
      hours: [0], // Default to 1 hour minimum for backend compatibility
    };
    setAppliances([...appliances, newAppliance]);
  };

  const updateAppliance = (id: string, updated: Appliance) => {
    setAppliances(appliances.map(a => a.id === id ? updated : a));
  };

  const removeAppliance = (id: string) => {
    setAppliances(appliances.filter(a => a.id !== id));
  };

  const handleOptimize = async () => {
    if (appliances.length === 0 || tariffRates.length === 0) {
      alert('Please add appliances and upload tariff rates first.');
      return;
    }

    const invalidAppliances = appliances.filter(
      a => !a.name || a.wattage <= 0 || (a.isEssential ? false : a.hours.length === 0)
    );

    if (invalidAppliances.length > 0) {
      alert('Please complete all appliance details (name, wattage, and minimum ON hours for non-essential appliances).');
      return;
    }

    setIsOptimizing(true);
    setResult(null);
    setOptimizationResponse(null);
    setSelectedResultIndex(0);

    try {
      const response = await optimizeSchedule(
        appliances,
        tariffRates,
        optimizationParams.iterations,
        optimizationParams.populationSize
      );
      
      if (response.success && response.results && response.results.length > 0) {
        setOptimizationResponse({
          baseline: response.baseline,
          results: response.results
        });
        setResult(response.results[0]); // Set first result as default
        setIsOptimizing(false);

        setTimeout(() => {
          document.getElementById('results-section')?.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Optimization error:', error);
      const errorMessage = error?.message || 'Unknown error';
      alert(`Failed to optimize schedule.\n\nError: ${errorMessage}\n\nPlease ensure:\n1. Backend server is running on http://localhost:5000\n2. Backend dependencies are installed (pip install -r requirements.txt)\n3. No firewall is blocking the connection`);
      setIsOptimizing(false);
    }
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <Header onToggleExplanation={() => setShowExplanation(!showExplanation)} />

        {/* Demo Mode Button */}
        <div className="mb-12 flex justify-center">
          <Button
            onClick={loadDemoData}
            variant="outline"
            className="glass-card border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105"
          >
            <Database className="w-5 h-5 mr-2" />
            Load Demo Data
          </Button>
        </div>

        {/* Appliances Section */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white font-space-grotesk">Appliance Configuration</h2>
                <p className="text-slate-400">Define your electrical loads and schedules</p>
              </div>
            </div>
            
            {/* Live power summary */}
            {appliances.length > 0 && (
              <Card className="glass-card-light rounded-xl px-6 py-3 border border-blue-500/20">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-xs text-slate-400">Total Connected Load</p>
                    <p className="text-lg font-bold text-white font-space-grotesk">{totalWattage.toLocaleString()} W</p>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="space-y-6 mb-8">
            {appliances.map((appliance, index) => (
              <div 
                key={appliance.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ApplianceCard
                  appliance={appliance}
                  onUpdate={(updated) => updateAppliance(appliance.id, updated)}
                  onRemove={() => removeAppliance(appliance.id)}
                />
              </div>
            ))}
          </div>

          <Button
            onClick={addAppliance}
            variant="outline"
            className="w-full py-8 rounded-2xl border-2 border-dashed border-slate-700 hover:border-blue-500/50 
                       bg-slate-800/30 hover:bg-blue-500/10 transition-all duration-300 group"
          >
            <div className="flex items-center gap-3 text-slate-400 group-hover:text-blue-400 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-slate-800 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6" />
              </div>
              <span className="text-lg font-medium">Add Appliance</span>
            </div>
          </Button>
        </section>

        {/* Tariff Section */}
        <section className="mb-16">
          <TariffUpload 
            onTariffUpload={setTariffRates}
            tariffRates={tariffRates}
          />
        </section>

        {/* Advanced Settings */}
        <section className="mb-16">
          <AdvancedSettings
            params={optimizationParams}
            onParamsChange={setOptimizationParams}
          />
        </section>

        {/* Backend Connection Status */}
        {backendConnected === false && (
          <section className="mb-8">
            <Card className="glass-card rounded-2xl border-2 border-red-500/50 bg-red-500/10 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-400">Backend Server Not Connected</h3>
                  <p className="text-sm text-red-300">
                    Please start the Flask backend server on <code className="bg-slate-800 px-2 py-1 rounded">http://localhost:5000</code>
                  </p>
                  <p className="text-xs text-red-200 mt-1">
                    Run: <code className="bg-slate-800 px-2 py-1 rounded">python app.py</code> or use <code className="bg-slate-800 px-2 py-1 rounded">START_BACKEND.bat</code>
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Optimization Button */}
        <section className="mb-16 flex justify-center">
          <OptimizationButton
            onClick={handleOptimize}
            disabled={appliances.length === 0 || tariffRates.length === 0 || backendConnected === false}
            isLoading={isOptimizing}
          />
        </section>

        {/* Results Section */}
        {optimizationResponse && result && (
          <section id="results-section" className="mb-16">
            <ResultsDashboard 
              result={result} 
              tariffRates={tariffRates}
              allResults={optimizationResponse.results}
              baseline={optimizationResponse.baseline}
              selectedIndex={selectedResultIndex}
              onSelectResult={(index) => {
                setSelectedResultIndex(index);
                setResult(optimizationResponse.results[index]);
              }}
            />
          </section>
        )}


        {/* Explanation Panel */}
        <ExplanationPanel 
          isOpen={showExplanation} 
          onClose={() => setShowExplanation(false)}
        />
      </div>
    </div>
  );
}
