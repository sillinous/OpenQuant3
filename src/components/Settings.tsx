import React, { useState } from 'react';
import { X, Save, ShieldAlert, SlidersHorizontal, Zap } from 'lucide-react';
import { SimulationConfig } from '../services/tradingSimulation';

interface SettingsProps {
  config: SimulationConfig;
  onSave: (config: SimulationConfig) => void;
  onClose: () => void;
}

export default function Settings({ config, onSave, onClose }: SettingsProps) {
  const [localConfig, setLocalConfig] = useState<SimulationConfig>(config);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-zinc-400" />
            Bot Configuration
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors rounded-lg hover:bg-zinc-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Strategy Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
              <Zap className="w-4 h-4" /> Strategy Parameters
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Breakout Threshold</span>
                  <span className="font-mono text-zinc-300">{localConfig.breakoutThreshold}%</span>
                </label>
                <input type="range" min="0.05" max="1" step="0.05" value={localConfig.breakoutThreshold} onChange={(e) => setLocalConfig({ ...localConfig, breakoutThreshold: parseFloat(e.target.value) })} className="w-full accent-emerald-500" />
              </div>

              <div>
                <label className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Lookback Period</span>
                  <span className="font-mono text-zinc-300">{localConfig.lookbackPeriod} Candles</span>
                </label>
                <input type="range" min="5" max="100" step="5" value={localConfig.lookbackPeriod} onChange={(e) => setLocalConfig({ ...localConfig, lookbackPeriod: parseInt(e.target.value, 10) })} className="w-full accent-emerald-500" />
              </div>
            </div>
          </div>

          {/* Risk Management */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-rose-400 flex items-center gap-2 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" /> Risk Management
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Take Profit</span>
                  <span className="font-mono text-zinc-300">{localConfig.takeProfit.toFixed(1)}%</span>
                </label>
                <input type="range" min="0.5" max="10" step="0.5" value={localConfig.takeProfit} onChange={(e) => setLocalConfig({ ...localConfig, takeProfit: parseFloat(e.target.value) })} className="w-full accent-rose-500" />
              </div>

              <div>
                <label className="flex justify-between text-xs text-zinc-400 mb-1">
                  <span>Stop Loss</span>
                  <span className="font-mono text-zinc-300">{localConfig.stopLoss.toFixed(1)}%</span>
                </label>
                <input type="range" min="0.5" max="5" step="0.1" value={localConfig.stopLoss} onChange={(e) => setLocalConfig({ ...localConfig, stopLoss: parseFloat(e.target.value) })} className="w-full accent-rose-500" />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-zinc-300">Auto-Trade Execution</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={localConfig.autoTrade} onChange={(e) => setLocalConfig({ ...localConfig, autoTrade: e.target.checked })} />
                  <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/30 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
