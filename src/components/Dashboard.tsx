import React, { useEffect, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Clock, Settings, TrendingUp, AlertCircle, BarChart2, List } from 'lucide-react';
import { simulation, SimulationState, Asset, Trade, Signal } from '../services/tradingSimulation';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import SettingsPanel from './Settings';
import { motion, AnimatePresence } from 'motion/react';

export default function Dashboard() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC/USD');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hoveredData, setHoveredData] = useState<any>(null);

  useEffect(() => {
    simulation.start();
    const unsubscribe = simulation.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      simulation.stop();
      unsubscribe();
    };
  }, []);

  if (!state) return <div className="flex items-center justify-center h-screen bg-zinc-950 text-zinc-400">Initializing Bot...</div>;

  const asset = state.assets[selectedAsset];
  const openTrades = state.trades.filter(t => t.status === 'OPEN');
  const recentSignals = state.signals.slice(0, 5);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  const formatTime = (timestamp: number) => new Date(timestamp).toLocaleTimeString();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 font-sans">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Breakout Bot</h1>
            <p className="text-xs text-zinc-500 font-mono">v1.0.4 • LIVE</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Total PnL</span>
            <span className={`text-lg font-mono font-bold ${state.totalPnlUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {state.totalPnlUsd >= 0 ? '+' : ''}{formatPrice(state.totalPnlUsd)}
            </span>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-zinc-400">System Active</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Assets & Signals */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 flex flex-col max-h-[600px]">
            <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2 shrink-0">
              <BarChart2 className="w-4 h-4" /> Monitored Assets
            </h2>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar">
              {(Object.values(state.assets) as Asset[]).map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => setSelectedAsset(a.symbol)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                    selectedAsset === a.symbol ? 'bg-zinc-800 border-zinc-700' : 'hover:bg-zinc-800/50 border-transparent'
                  } border`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center text-xs font-bold border border-zinc-800">
                      {a.symbol.split('/')[0]}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-zinc-200">{a.symbol}</div>
                      <div className="text-xs text-zinc-500">{a.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-zinc-300">{formatPrice(a.currentPrice)}</div>
                    <div className={`text-xs flex items-center justify-end gap-1 ${
                      a.currentPrice > a.history[a.history.length - 2]?.close ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {a.currentPrice > a.history[a.history.length - 2]?.close ? (
                        <ArrowUpRight className="w-3 h-3" />
                      ) : (
                        <ArrowDownRight className="w-3 h-3" />
                      )}
                      {Math.abs(((a.currentPrice - a.history[a.history.length - 2]?.close) / a.history[a.history.length - 2]?.close) * 100).toFixed(2)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Recent Signals
            </h2>
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {recentSignals.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-zinc-500 text-center py-4"
                  >
                    No recent signals
                  </motion.div>
                ) : (
                  recentSignals.map((signal) => (
                    <motion.div 
                      key={signal.id} 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-between p-2 rounded-lg bg-zinc-900 border border-zinc-800/50"
                    >
                      <div className="flex items-center gap-2">
                        {signal.type === 'BREAKOUT_UP' ? (
                          <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-rose-400" />
                        )}
                        <div>
                          <div className="text-xs font-medium">{signal.symbol}</div>
                          <div className="text-[10px] text-zinc-500">{formatTime(signal.timestamp)}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono">{formatPrice(signal.price)}</div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Middle Column: Chart & Active Trades */}
        <div className="lg:col-span-6 space-y-6">
          {/* Chart Section */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 h-[400px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">{asset.symbol} <span className="text-zinc-500 text-sm font-normal">{asset.name}</span></h2>
                <div className="text-2xl font-mono mt-1 flex items-baseline gap-3">
                  {hoveredData ? formatPrice(hoveredData.close) : formatPrice(asset.currentPrice)}
                  {hoveredData && (
                    <span className="text-sm text-zinc-500 font-sans">
                      {new Date(hoveredData.time).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-right">
                  <div className="text-zinc-500 text-xs">Resistance</div>
                  <div className="font-mono text-rose-400">{formatPrice(asset.resistance)}</div>
                </div>
                <div className="text-right">
                  <div className="text-zinc-500 text-xs">Support</div>
                  <div className="font-mono text-emerald-400">{formatPrice(asset.support)}</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart 
                  data={asset.history} 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                  onMouseMove={(e: any) => {
                    if (e?.activePayload && e.activePayload.length > 0) {
                      setHoveredData(e.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => setHoveredData(null)}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tickFormatter={(time) => new Date(time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    yAxisId="price"
                    domain={['auto', 'auto']} 
                    stroke="#52525b" 
                    fontSize={10} 
                    tickFormatter={(val) => `$${val.toLocaleString()}`}
                    width={80}
                  />
                  <YAxis 
                    yAxisId="volume"
                    orientation="right"
                    hide
                    domain={[0, (dataMax: number) => dataMax * 4]}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                    formatter={(value: number, name: string) => {
                      if (name === 'volume') return [value.toFixed(2), 'Volume'];
                      return [formatPrice(value), 'Price'];
                    }}
                  />
                  <ReferenceLine yAxisId="price" y={asset.resistance} stroke="#f43f5e" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine yAxisId="price" y={asset.support} stroke="#10b981" strokeDasharray="3 3" opacity={0.5} />
                  <ReferenceLine yAxisId="price" y={asset.currentPrice} stroke="#3b82f6" strokeDasharray="2 4" opacity={0.5} />
                  <Bar 
                    yAxisId="volume"
                    dataKey="volume" 
                    fill="#3f3f46" 
                    opacity={0.5}
                    isAnimationActive={false}
                  />
                  <Line 
                    yAxisId="price"
                    type="monotone" 
                    dataKey="close" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={(props: any) => {
                      const { cx, cy, index } = props;
                      if (index === asset.history.length - 1) {
                        return (
                          <circle key={`dot-${index}`} cx={cx} cy={cy} r={4} fill="#3b82f6" className="animate-pulse" />
                        );
                      }
                      return null;
                    }}
                    activeDot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Order Book */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 h-[400px] flex flex-col">
            <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
              <List className="w-4 h-4" /> Order Book
            </h2>
            <div className="flex-1 overflow-hidden flex flex-col text-xs font-mono">
              <div className="flex justify-between text-zinc-500 mb-2 px-2">
                <span>Price</span>
                <span>Size</span>
                <span>Total</span>
              </div>
              
              {/* Asks (Sell Orders) */}
              <div className="flex flex-col-reverse gap-[2px] overflow-hidden">
                {asset.orderBook?.asks.slice(0, 10).map((ask, i) => (
                  <div key={`ask-${i}`} className="relative flex justify-between px-2 py-1 group">
                    <div 
                      className="absolute inset-y-0 right-0 bg-rose-500/10 transition-all"
                      style={{ width: `${(ask.total / asset.orderBook.asks[Math.min(9, asset.orderBook.asks.length - 1)].total) * 100}%` }}
                    />
                    <span className="text-rose-400 relative z-10">{formatPrice(ask.price)}</span>
                    <span className="text-zinc-300 relative z-10">{ask.size.toFixed(4)}</span>
                    <span className="text-zinc-500 relative z-10">{ask.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>

              {/* Current Price Spread */}
              <div className="py-2 text-center border-y border-zinc-800/50 my-2">
                <span className="text-sm font-medium text-zinc-200">{formatPrice(asset.currentPrice)}</span>
              </div>

              {/* Bids (Buy Orders) */}
              <div className="flex flex-col gap-[2px] overflow-hidden">
                {asset.orderBook?.bids.slice(0, 10).map((bid, i) => (
                  <div key={`bid-${i}`} className="relative flex justify-between px-2 py-1 group">
                    <div 
                      className="absolute inset-y-0 right-0 bg-emerald-500/10 transition-all"
                      style={{ width: `${(bid.total / asset.orderBook.bids[Math.min(9, asset.orderBook.bids.length - 1)].total) * 100}%` }}
                    />
                    <span className="text-emerald-400 relative z-10">{formatPrice(bid.price)}</span>
                    <span className="text-zinc-300 relative z-10">{bid.size.toFixed(4)}</span>
                    <span className="text-zinc-500 relative z-10">{bid.total.toFixed(4)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Trades */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 mt-6">
        <h2 className="text-sm font-medium text-zinc-400 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Active Positions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50 border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Asset</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Size</th>
                <th className="px-4 py-3 font-medium">Entry Price</th>
                <th className="px-4 py-3 font-medium">Current Price</th>
                <th className="px-4 py-3 font-medium">Entry Time</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Unrealized PnL</th>
              </tr>
            </thead>
            <tbody className="relative">
              <AnimatePresence initial={false}>
                {openTrades.length === 0 ? (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 text-xs">
                      No active positions
                    </td>
                  </motion.tr>
                ) : (
                  openTrades.map((trade) => {
                    const currentPrice = state.assets[trade.symbol].currentPrice;
                    const isProfit = trade.pnl && trade.pnl > 0;
                    return (
                      <motion.tr 
                        key={trade.id} 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-zinc-300">{trade.symbol}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            trade.type === 'LONG' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-zinc-400">{formatPrice(trade.size)}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400">{formatPrice(trade.entryPrice)}</td>
                        <td className="px-4 py-3 font-mono text-zinc-300">{formatPrice(currentPrice)}</td>
                        <td className="px-4 py-3 font-mono text-zinc-400 text-xs">
                          {new Date(trade.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {Math.floor((Date.now() - trade.timestamp) / 60000)}m
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-right font-mono ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex flex-col items-end">
                            <span>{isProfit ? '+' : ''}{trade.pnlUsd?.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                            <span className="text-[10px] opacity-70">{isProfit ? '+' : ''}{trade.pnl?.toFixed(2)}%</span>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
      {isSettingsOpen && <SettingsPanel onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}
