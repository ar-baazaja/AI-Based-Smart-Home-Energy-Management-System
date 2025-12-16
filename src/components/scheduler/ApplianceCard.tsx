import { Zap, Lock, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Appliance } from '@/types/scheduler';

interface ApplianceCardProps {
  appliance: Appliance;
  onUpdate: (appliance: Appliance) => void;
  onRemove: () => void;
}

export function ApplianceCard({ appliance, onUpdate, onRemove }: ApplianceCardProps) {

  return (
    <Card 
      className="glass-card rounded-2xl border-0 overflow-hidden transition-all duration-300 hover:glow-purple"
    >
      {/* Gradient top border */}
      <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500"></div>
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Appliance Configuration</h3>
              <p className="text-sm text-slate-400">Define power and schedule</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-10 w-10 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor={`name-${appliance.id}`} className="text-sm font-medium text-slate-300">
              Appliance Name
            </Label>
            <Input
              id={`name-${appliance.id}`}
              value={appliance.name}
              onChange={(e) => onUpdate({ ...appliance, name: e.target.value })}
              placeholder="e.g., Washing Machine"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`wattage-${appliance.id}`} className="text-sm font-medium text-slate-300">
              Power Rating (Watts)
            </Label>
            <Input
              id={`wattage-${appliance.id}`}
              type="number"
              value={appliance.wattage || ''}
              onChange={(e) => onUpdate({ ...appliance, wattage: parseInt(e.target.value) || 0 })}
              placeholder="e.g., 2000"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {appliance.isEssential && <Lock className="w-4 h-4 text-amber-400" />}
              <div>
                <Label htmlFor={`essential-${appliance.id}`} className="text-sm font-medium text-white cursor-pointer">
                  Essential Load
                </Label>
                <p className="text-xs text-slate-400 mt-0.5">Cannot be rescheduled by optimizer</p>
              </div>
            </div>
            <Switch
              id={`essential-${appliance.id}`}
              checked={appliance.isEssential}
              onCheckedChange={(checked) => onUpdate({ ...appliance, isEssential: checked })}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
        </div>

        {!appliance.isEssential && (
          <div className="mt-6 space-y-2">
            <Label htmlFor={`minHours-${appliance.id}`} className="text-sm font-medium text-slate-300">
              Minimum ON Hours per Day
            </Label>
            <Input
              id={`minHours-${appliance.id}`}
              type="number"
              min="1"
              max="24"
              value={appliance.hours.length || ''}
              onChange={(e) => {
                const minHours = parseInt(e.target.value) || 0;
                // Create hours array with length equal to minHours for backend compatibility
                const hours = Array.from({ length: Math.min(minHours, 24) }, (_, i) => i);
                onUpdate({ ...appliance, hours });
              }}
              placeholder="e.g., 3"
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 rounded-xl focus:border-blue-500 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-400">Number of hours this appliance must be ON daily</p>
          </div>
        )}
      </div>
    </Card>
  );
}
