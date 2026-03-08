import React from 'react';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus, Clock, ShieldCheck } from 'lucide-react';
import { AIInsight, MetricData } from '../services/tradingSimulation';
import { motion, AnimatePresence } from 'motion/react';

interface AIAnalystProps {
  insights: AIInsight[];
  metrics: MetricData;
}

export default function AIAnalyst({ insights, metrics }: AIAnalystProps) {
  const latestInsight = insights[0];

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return <TrendingUp className="w-5 h-5 text-emerald-400" />;
      case 'BEARISH': return <TrendingDown className="w-5 h-5 text-rose-400" />;
      default: return <Minus className="w-5 h-5 text-zinc-400" />;
    }
  };

  const formatPercent = (val: number) => `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;

  return (
    <div className="space-y-6">
      {/* Metrics Card */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
        <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Performance Metrics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Win Rate</div>
            <div className="text-lg font-mono font-bold text-emerald-400">{metrics.winRate.toFixed(1)}%</div>
          </div>
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Total Trades</div>
            <div className="text-lg font-mono font-bold text-zinc-100">{metrics.totalTrades}</div>
          </div>
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Max DD</div>
            <div className="text-lg font-mono font-bold text-rose-400">-{metrics.maxDrawdown.toFixed(1)}%</div>
          </div>
          <div className="p-3 bg-zinc-950/50 rounded-xl border border-zinc-800/30">
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Sharpe</div>
            <div className="text-lg font-mono font-bold text-zinc-100">{metrics.sharpeRatio.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* AI Analyst Card */}
      <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Brain className="w-24 h-24 text-indigo-400 transform translate-x-8 -translate-y-8" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI Analyst Insight
            </h2>
            <div className={`px-2 py-0.5 rounded-full border text-[10px] font-medium animate-pulse ${latestInsight?.commentary.includes('[Local Engine]')
                ? 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}>
              {latestInsight?.commentary.includes('[Local Engine]') ? 'LOCAL' : 'CLOUD'}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!latestInsight ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-zinc-500 italic py-4"
              >
                Waiting for Gemini market analysis...
              </motion.div>
            ) : (
              <motion.div
                key={latestInsight.timestamp}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                    {getSentimentIcon(latestInsight.sentiment)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      {latestInsight.sentiment} SENTIMENT
                    </div>
                    <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Confidence: {(latestInsight.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-indigo-500/30 pl-3">
                  "{latestInsight.commentary}"
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
