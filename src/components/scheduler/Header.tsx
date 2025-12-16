import { Lightbulb, Zap, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  onToggleExplanation: () => void;
}

// Animated background graph component
function AnimatedGraph() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-20"
      viewBox="0 0 800 200"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <path
        d="M0,150 Q50,120 100,130 T200,100 T300,140 T400,80 T500,120 T600,60 T700,100 T800,70"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="2"
        filter="url(#glow)"
        className="animate-line-draw"
      />
      <path
        d="M0,170 Q50,150 100,160 T200,130 T300,150 T400,110 T500,140 T600,90 T700,120 T800,100"
        fill="none"
        stroke="url(#lineGradient)"
        strokeWidth="1.5"
        opacity="0.5"
        filter="url(#glow)"
        className="animate-line-draw"
        style={{ animationDelay: '0.3s' }}
      />
    </svg>
  );
}

export function Header({ onToggleExplanation }: HeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-card glow-blue p-8 md:p-12 mb-16">
      <AnimatedGraph />
      
      {/* Gradient orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg animate-float">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <Badge 
                variant="secondary" 
                className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 border border-blue-500/30 px-4 py-1.5 text-sm font-medium"
              >
                <Activity className="w-3 h-3 mr-1.5 inline" />
                24-Hour Intelligent Scheduling
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space-grotesk tracking-tight">
              <span className="gradient-text">AI-Based</span>
              <br />
              <span className="text-white">Smart Load Scheduling</span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed">
              Hybrid <span className="text-blue-400 font-semibold">GA-PSO</span> Optimization for 
              Cost-Efficient Energy Usage. Intelligent scheduling that saves money while respecting your constraints.
            </p>
          </div>
          
          <button
            onClick={onToggleExplanation}
            className="flex items-center gap-3 px-6 py-3 glass-card-light rounded-xl 
                       hover:bg-white/10 transition-all duration-300 hover:scale-105 
                       border border-white/10 hover:border-blue-500/50 group self-start"
            aria-label="Toggle explanation"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center group-hover:animate-pulse">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="text-white font-medium block">How it works</span>
              <span className="text-slate-400 text-sm">Learn the algorithm</span>
            </div>
          </button>
        </div>
        
        {/* Tech badges */}
        <div className="flex flex-wrap gap-2 mt-8">
          {['Genetic Algorithm', 'Particle Swarm', 'Smart Grid', 'Cost Optimization'].map((tag) => (
            <span 
              key={tag}
              className="px-3 py-1 text-xs font-medium text-slate-400 bg-slate-800/50 rounded-full border border-slate-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
