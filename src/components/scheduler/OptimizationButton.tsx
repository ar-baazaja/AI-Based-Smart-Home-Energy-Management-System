import { useState, useEffect } from 'react';
import { Play, Sparkles, Cpu, GitBranch, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OptimizationButtonProps {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}

const loadingStages = [
  { message: "Initializing Population", icon: Cpu, color: "text-blue-400" },
  { message: "Applying PSO Velocity Update", icon: Sparkles, color: "text-purple-400" },
  { message: "GA Crossover & Mutation", icon: GitBranch, color: "text-emerald-400" },
  { message: "Evaluating Fitness Functions", icon: Shuffle, color: "text-cyan-400" },
  { message: "Converging to Optimal Solution", icon: Sparkles, color: "text-amber-400" },
  { message: "Finalizing Schedule", icon: Play, color: "text-green-400" }
];

export function OptimizationButton({ onClick, disabled, isLoading }: OptimizationButtonProps) {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      setStageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % loadingStages.length);
    }, 1200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const currentStage = loadingStages[stageIndex];
  const StageIcon = currentStage.icon;

  return (
    <div className="flex flex-col items-center gap-6">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        className={`
          relative px-12 py-8 text-xl font-bold rounded-2xl
          bg-gradient-to-r from-blue-600 via-purple-600 to-emerald-600
          hover:from-blue-500 hover:via-purple-500 hover:to-emerald-500
          text-white shadow-2xl
          transition-all duration-300
          hover:scale-105 hover:shadow-[0_0_40px_rgba(96,165,250,0.4)]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          overflow-hidden
          ${isLoading ? 'animate-pulse-glow' : ''}
        `}
      >
        {isLoading ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Optimizing...</span>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <span>Run GA-PSO Optimization</span>
          </div>
        )}
      </Button>

      {isLoading && (
        <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-fadeIn">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center ${currentStage.color}`}>
              <StageIcon className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${currentStage.color}`}>
                {currentStage.message}
              </p>
              <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${((stageIndex + 1) / loadingStages.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && !disabled && (
        <p className="text-sm text-slate-500 text-center max-w-md">
          Click to start the hybrid Genetic Algorithm + Particle Swarm Optimization
        </p>
      )}
    </div>
  );
}
