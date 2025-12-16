import { useEffect, useState } from 'react';
import { TrendingDown, Lock, DollarSign, BarChart3, Calendar, Percent, Sparkles, Zap, Battery } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { OptimizationResult, TariffRate } from '@/types/scheduler';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResultsDashboardProps {
  result: OptimizationResult;
  tariffRates?: TariffRate[];
  allResults?: OptimizationResult[];
  baseline?: { schedule: any, cost: number };
  selectedIndex?: number;
  onSelectResult?: (index: number) => void;
}

export function ResultsDashboard({ 
  result, 
  tariffRates = [], 
  allResults = [],
  baseline,
  selectedIndex = 0,
  onSelectResult
}: ResultsDashboardProps) {
  const [animatedSavings, setAnimatedSavings] = useState(0);
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = result.savings;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedSavings(end);
        clearInterval(timer);
      } else {
        setAnimatedSavings(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [result.savings]);

  useEffect(() => {
    let start = 0;
    const end = result.savingsPercentage;
    const duration = 1500;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedPercentage(end);
        clearInterval(timer);
      } else {
        setAnimatedPercentage(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [result.savingsPercentage]);

  const chartData = [
    {
      name: 'Before',
      cost: result.costBefore,
      fill: '#ef4444'
    },
    {
      name: 'After',
      cost: result.costAfter,
      fill: '#22c55e'
    },
  ];

  // Check if hour is peak
  const isPeakHour = (hour: number) => {
    return tariffRates.find(r => r.hour === hour)?.isPeak || false;
  };

  const optimizationLabels = [
    { label: 'Most Optimized', icon: Sparkles, color: 'emerald' },
    { label: 'Moderately Optimized', icon: Zap, color: 'blue' },
    { label: 'Least Optimized', icon: Battery, color: 'amber' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center border border-emerald-500/30">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-space-grotesk">Results & Insights</h2>
            <p className="text-slate-400">Your optimized electricity schedule is ready</p>
          </div>
        </div>
      </div>

      {/* Optimization Options Selector */}
      {allResults.length > 1 && onSelectResult && (
        <Card className="glass-card rounded-2xl border-0 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Select Optimization Level</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {allResults.map((optResult, index) => {
              const label = optimizationLabels[index] || optimizationLabels[0];
              const Icon = label.icon;
              const isSelected = selectedIndex === index;
              
              // Get color classes based on label color
              let bgClass = 'bg-slate-800/30';
              let borderClass = 'border-slate-700/50';
              let textClass = 'text-slate-300';
              let iconClass = 'text-slate-400';
              
              if (isSelected) {
                if (label.color === 'emerald') {
                  bgClass = 'bg-emerald-500/20';
                  borderClass = 'border-emerald-500/50 border-2';
                  textClass = 'text-emerald-400';
                  iconClass = 'text-emerald-400';
                } else if (label.color === 'blue') {
                  bgClass = 'bg-blue-500/20';
                  borderClass = 'border-blue-500/50 border-2';
                  textClass = 'text-blue-400';
                  iconClass = 'text-blue-400';
                } else if (label.color === 'amber') {
                  bgClass = 'bg-amber-500/20';
                  borderClass = 'border-amber-500/50 border-2';
                  textClass = 'text-amber-400';
                  iconClass = 'text-amber-400';
                }
              } else {
                borderClass += ' hover:border-slate-600';
              }
              
              return (
                <Button
                  key={index}
                  onClick={() => onSelectResult(index)}
                  variant="outline"
                  className={`h-auto p-4 flex flex-col items-start gap-3 rounded-xl transition-all duration-300 ${bgClass} ${borderClass}`}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`w-5 h-5 ${iconClass}`} />
                    <span className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                      {label.label}
                    </span>
                  </div>
                  <div className="w-full space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Cost:</span>
                      <span className={`text-sm font-bold ${textClass}`}>
                        PKR {optResult.costAfter.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-400">Savings:</span>
                      <span className={`text-sm font-bold ${textClass}`}>
                        {optResult.savingsPercentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Cost Savings Hero Card */}
        <Card className="md:col-span-2 glass-card rounded-2xl border-0 overflow-hidden glow-green">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500"></div>
          <div className="p-8 relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Optimized Cost</h3>
                  <p className="text-sm text-slate-400">Total daily electricity cost</p>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="text-6xl md:text-7xl font-bold text-white font-space-grotesk">
                  PKR {animatedSavings.toFixed(0)}
                </span>
                <span className="text-2xl text-emerald-400 ml-2">saved</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 text-lg">
                  <TrendingDown className="w-4 h-4 mr-2" />
                  {animatedPercentage.toFixed(1)}% reduction
                </Badge>
                <span className="text-slate-400">
                  From PKR {result.costBefore.toFixed(0)} → PKR {result.costAfter.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Percentage Card */}
        <Card className="glass-card rounded-2xl border-0 p-6 flex flex-col justify-center items-center glow-purple">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-4 border-purple-500/50 flex items-center justify-center mb-4">
            <div className="text-center">
              <span className="text-4xl font-bold text-white font-space-grotesk">{animatedPercentage.toFixed(0)}</span>
              <span className="text-xl text-purple-400">%</span>
            </div>
          </div>
          <p className="text-slate-400 text-center">Cost Reduction Achieved</p>
        </Card>
      </div>

      {/* Before/After Chart */}
      <Card className="glass-card rounded-2xl border-0 p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Cost Comparison</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8' }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8' }} label={{ value: 'Cost (PKR)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value: number) => [`PKR ${value.toFixed(2)}`, 'Cost']}
            />
            <Bar dataKey="cost" radius={[12, 12, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* 24-Hour Schedule Grid */}
      <Card className="glass-card rounded-2xl border-0 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Smart Schedule Table</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-emerald-500 to-teal-500"></div>
              <span className="text-slate-400">ON</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-700"></div>
              <span className="text-slate-400">OFF</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gradient-to-br from-amber-500 to-orange-500 ring-2 ring-amber-400/50"></div>
              <span className="text-slate-400">Essential</span>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-800/50">
                <th className="text-left py-4 px-4 font-semibold text-slate-300 sticky left-0 bg-slate-800/90 backdrop-blur-sm z-10 min-w-[150px]">
                  Appliance
                </th>
                {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                  <th 
                    key={hour} 
                    className={`text-center py-4 px-1 font-jetbrains text-xs min-w-[36px] ${
                      isPeakHour(hour) ? 'text-red-400 bg-red-500/10' : 'text-slate-400'
                    }`}
                  >
                    {hour.toString().padStart(2, '0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.schedule[0][0].appliances.map((appliance, appIndex) => (
                <tr 
                  key={appliance.id}
                  className={`
                    transition-colors duration-150 hover:bg-slate-800/30
                    ${appIndex % 2 === 0 ? 'bg-slate-800/20' : 'bg-slate-800/10'}
                  `}
                >
                  <td className="py-3 px-4 font-medium text-white sticky left-0 bg-inherit backdrop-blur-sm z-10">
                    <div className="flex items-center gap-2">
                      <span className="truncate">{appliance.name}</span>
                      {appliance.isEssential && (
                        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      )}
                    </div>
                  </td>
                  {result.schedule.map((hourData, hour) => {
                    const appData = hourData[0].appliances[appIndex];
                    const isPeak = isPeakHour(hour);
                    return (
                      <td key={hour} className={`p-1 ${isPeak ? 'bg-red-500/5' : ''}`}>
                        <div
                          className={`
                            h-8 rounded-md transition-all duration-150 cursor-pointer
                            hover:scale-110 hover:z-10 relative
                            ${appData.isOn
                              ? appData.isEssential
                                ? 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/30'
                                : 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
                              : 'bg-slate-700/50'
                            }
                          `}
                          title={`${appliance.name} - Hour ${hour}:00 - ${appData.isOn ? 'ON' : 'OFF'}${appData.isEssential ? ' (Essential)' : ''}`}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Peak hours indicator */}
        {tariffRates.length > 0 && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-300">
              <strong>⚠️ Peak Hours:</strong> Columns with red headers indicate high-tariff periods. 
              The optimizer has shifted non-essential loads away from these hours.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
