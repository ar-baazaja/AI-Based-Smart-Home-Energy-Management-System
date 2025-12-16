import { Card } from '@/components/ui/card';
import { Lightbulb, Zap, Clock, TrendingDown, Brain, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExplanationPanelProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function ExplanationPanel({ isOpen, onClose }: ExplanationPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-5xl glass-card rounded-2xl border-0 overflow-hidden animate-slideUp">
        {/* Gradient top border */}
        <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white font-space-grotesk">
                  AI Explanation Box
                </h3>
                <p className="text-slate-400">
                  Understanding the GA-PSO optimization in simple terms
                </p>
              </div>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>

          {/* Main explanation */}
          <div className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-blue-500/20 mb-8">
            <p className="text-slate-200 leading-relaxed text-lg">
              This system uses a <span className="text-blue-400 font-semibold">hybrid Genetic Algorithm</span> and 
              <span className="text-purple-400 font-semibold"> Particle Swarm Optimization</span> approach to 
              intelligently shift flexible electrical loads away from high-tariff hours, ensuring 
              <span className="text-emerald-400 font-semibold"> minimum cost</span> while respecting essential 
              and user-defined constraints.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="glass-card-light rounded-xl p-6 space-y-4 hover:glow-blue transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/30">
                <Clock className="w-6 h-6 text-red-400" />
              </div>
              <h4 className="font-semibold text-white text-lg">Peak vs Off-Peak</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Electricity costs more during peak hours when demand is high. 
                Our system identifies these expensive periods and moves flexible loads to cheaper times.
              </p>
            </div>

            <div className="glass-card-light rounded-xl p-6 space-y-4 hover:glow-purple transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center border border-amber-500/30">
                <Zap className="w-6 h-6 text-amber-400" />
              </div>
              <h4 className="font-semibold text-white text-lg">Essential Loads</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Some appliances can't be rescheduled (like refrigerators). 
                These "essential loads" stay on their original schedule while others are optimized around them.
              </p>
            </div>

            <div className="glass-card-light rounded-xl p-6 space-y-4 hover:glow-green transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/30">
                <TrendingDown className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="font-semibold text-white text-lg">Smart Algorithm</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                GA-PSO tests thousands of schedule combinations using evolutionary principles 
                to find the one that saves you the most money.
              </p>
            </div>
          </div>

          <div className="mt-8 p-5 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-sm text-slate-300">
              <strong className="text-emerald-400">💡 Real-world example:</strong> Instead of running your washing machine at 2 PM (peak rate: PKR 25/kWh), 
              the system schedules it for 11 PM (off-peak: PKR 8/kWh), saving you money without any lifestyle changes.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
