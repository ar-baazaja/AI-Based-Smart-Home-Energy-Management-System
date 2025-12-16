import { useCallback, useState } from 'react';
import { Upload, FileText, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TariffRate } from '@/types/scheduler';
import { parseTariffFile, detectPeakHours } from '@/lib/optimizer';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TariffUploadProps {
  onTariffUpload: (rates: TariffRate[]) => void;
  tariffRates: TariffRate[];
}

export function TariffUpload({ onTariffUpload, tariffRates }: TariffUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const fileType = file.name.endsWith('.json') ? 'json' : 'csv';
      
      try {
        const rates = parseTariffFile(content, fileType);
        const ratesWithPeaks = detectPeakHours(rates);
        onTariffUpload(ratesWithPeaks);
      } catch (error) {
        console.error('Error parsing tariff file:', error);
        alert('Error parsing file. Please check the format.');
      }
    };
    reader.readAsText(file);
  }, [onTariffUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const chartData = tariffRates.map(rate => ({
    hour: `${rate.hour}:00`,
    rate: rate.rate,
    isPeak: rate.isPeak
  }));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/30">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white font-space-grotesk">Tariff Intelligence</h2>
            <p className="text-slate-400">Upload your hourly electricity rates</p>
          </div>
        </div>
      </div>

      <Card
        className={`
          glass-card rounded-2xl border-2 border-dashed p-8
          transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10 glow-blue' 
            : 'border-slate-700 hover:border-blue-500/50 hover:bg-slate-800/50'
          }
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('tariff-file-input')?.click()}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-6 border border-blue-500/30">
            <Upload className="w-10 h-10 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Drop your tariff file here
          </h3>
          <p className="text-slate-400 mb-6">
            or click to browse your files
          </p>
          <div className="flex gap-3">
            <Badge className="bg-slate-800 text-slate-300 border border-slate-700 px-4 py-1.5">CSV</Badge>
            <Badge className="bg-slate-800 text-slate-300 border border-slate-700 px-4 py-1.5">JSON</Badge>
          </div>
        </div>
        <input
          id="tariff-file-input"
          type="file"
          accept=".csv,.json"
          onChange={handleFileInput}
          className="hidden"
        />
      </Card>

      {tariffRates.length > 0 && (
        <>
          {/* Tariff Chart */}
          <Card className="glass-card rounded-2xl border-0 p-6 glow-blue">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Tariff Curve Analysis</h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-slate-400">Peak hours auto-detected</span>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#475569' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickLine={{ stroke: '#475569' }}
                  label={{ value: 'PKR/kWh', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                  }}
                  labelStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`PKR ${value.toFixed(3)}`, 'Rate']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#60a5fa" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRate)" 
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-slate-400">Off-Peak</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 glow-red"></div>
                <span className="text-sm text-slate-400">Peak (Top 25%)</span>
              </div>
            </div>
          </Card>

          {/* Tariff Table */}
          <Card className="glass-card rounded-2xl border-0 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Hourly Rate Details</h3>
            </div>
            
            <div className="max-h-72 overflow-y-auto rounded-xl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-800/90 backdrop-blur-sm">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-slate-300 border-b border-slate-700">Hour</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300 border-b border-slate-700">Rate (PKR/kWh)</th>
                    <th className="text-right py-3 px-4 font-semibold text-slate-300 border-b border-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tariffRates.map((rate, index) => (
                    <tr 
                      key={rate.hour}
                      className={`
                        transition-colors duration-150
                        ${rate.isPeak ? 'bg-red-500/5' : ''}
                        ${index % 2 === 0 ? 'bg-slate-800/30' : 'bg-slate-800/10'}
                        hover:bg-slate-700/30
                      `}
                    >
                      <td className="py-3 px-4 font-jetbrains text-white">{rate.hour.toString().padStart(2, '0')}:00</td>
                      <td className="py-3 px-4 text-right font-medium text-white">
                        PKR {rate.rate.toFixed(3)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {rate.isPeak && (
                          <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 glow-red">
                            Peak
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
