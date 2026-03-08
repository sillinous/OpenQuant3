import { GoogleGenerativeAI } from "@google/generative-ai";

export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sma?: number;
  rsi?: number;
}

export interface Order {
  price: number;
  size: number;
  total: number;
}

export interface OrderBook {
  bids: Order[];
  asks: Order[];
}

export interface Asset {
  symbol: string;
  name: string;
  currentPrice: number;
  support: number;
  resistance: number;
  history: PricePoint[];
  orderBook: OrderBook;
  indicators: {
    sma: number;
    rsi: number;
  };
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  exitPrice?: number;
  status: 'OPEN' | 'CLOSED';
  pnl?: number;
  pnlUsd?: number;
  size: number;
  timestamp: number;
}

export interface Signal {
  id: string;
  symbol: string;
  type: 'BREAKOUT_UP' | 'BREAKOUT_DOWN';
  price: number;
  timestamp: number;
}

export interface MetricData {
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

export interface AIInsight {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  commentary: string;
  confidence: number;
  timestamp: number;
}

export interface SimulationConfig {
  breakoutThreshold: number;
  lookbackPeriod: number;
  takeProfit: number;
  stopLoss: number;
  autoTrade: boolean;
  rsiPeriod: number;
  smaPeriod: number;
  volumeThreshold: number; // multiplier
}

class TradingSimulation {
  private assets: Record<string, Asset> = {};
  private trades: Trade[] = [];
  private signals: Signal[] = [];
  private aiInsights: AIInsight[] = [];
  private genAI: GoogleGenerativeAI | null = null;
  private metrics: MetricData = {
    winRate: 0,
    totalTrades: 0,
    profitableTrades: 0,
    maxDrawdown: 0,
    sharpeRatio: 0
  };
  private listeners: ((state: SimulationState) => void)[] = [];
  private intervalId: any = null;
  private config: SimulationConfig = {
    breakoutThreshold: 0.1,
    lookbackPeriod: 20,
    takeProfit: 2.0,
    stopLoss: 1.0,
    autoTrade: true,
    rsiPeriod: 14,
    smaPeriod: 20,
    volumeThreshold: 1.5
  };

  constructor() {
    this.initializeAssets();
    this.initGemini();
  }

  private initGemini() {
    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  public updateConfig(newConfig: Partial<SimulationConfig>) {
    this.config = { ...this.config, ...newConfig };
    this.notifyListeners();
  }

  private generateOrderBook(currentPrice: number, volatility: number): OrderBook {
    const bids: Order[] = [];
    const asks: Order[] = [];
    
    // Generate 15 levels of bids and asks
    for (let i = 1; i <= 15; i++) {
      const bidPrice = currentPrice * (1 - (Math.random() * volatility * 0.5 * i));
      const askPrice = currentPrice * (1 + (Math.random() * volatility * 0.5 * i));
      
      const bidSize = Math.random() * 2 + 0.1;
      const askSize = Math.random() * 2 + 0.1;
      
      bids.push({ price: bidPrice, size: bidSize, total: 0 });
      asks.push({ price: askPrice, size: askSize, total: 0 });
    }
    
    bids.sort((a, b) => b.price - a.price);
    asks.sort((a, b) => a.price - b.price);
    
    let bidTotal = 0;
    bids.forEach(b => { bidTotal += b.size; b.total = bidTotal; });
    
    let askTotal = 0;
    asks.forEach(a => { askTotal += a.size; a.total = askTotal; });
    
    return { bids, asks };
  }

  private initializeAssets() {
    const top100 = [
      "BTC", "ETH", "USDT", "BNB", "SOL", "USDC", "XRP", "DOGE", "TON", "ADA",
      "SHIB", "AVAX", "TRX", "DOT", "BCH", "LINK", "MATIC", "LTC", "NEAR", "ICP",
      "UNI", "APT", "PEPE", "DAI", "STX", "XLM", "ATOM", "ETC", "FIL", "IMX",
      "RNDR", "HBAR", "WIF", "MNT", "CRO", "VET", "MKR", "ARB", "OP", "INJ",
      "GRT", "TAO", "THETA", "FTM", "LDO", "TIA", "RUNE", "FLOKI", "BGB", "ALGO",
      "CORE", "GALA", "AAVE", "QNT", "SEI", "BSV", "EGLD", "FLOW", "JUP", "STRK",
      "AXS", "CHZ", "SAND", "EOS", "SNX", "MINA", "XTZ", "NEO", "KAVA", "IOTA",
      "CAKE", "XEC", "MANA", "GNO", "ZEC", "KLAY", "CFX", "TWT", "ROSE", "COMP",
      "NEXO", "CRV", "ENJ", "1INCH", "DASH", "BAT", "ZIL", "HOT", "LRC", "RVN",
      "YFI", "BAL", "KSM", "SUSHI", "ZRX", "BANCOR", "ONT", "QTUM", "OMG", "ICX"
    ];

    const symbols = top100.map((symbol, index) => {
      let basePrice = 1000 * Math.pow(0.8, index) + Math.random() * 10;
      if (symbol === 'BTC') basePrice = 65000;
      if (symbol === 'ETH') basePrice = 3500;
      if (symbol === 'BNB') basePrice = 600;
      if (symbol === 'SOL') basePrice = 150;
      if (symbol === 'USDT' || symbol === 'USDC' || symbol === 'DAI') basePrice = 1;
      if (symbol === 'DOGE') basePrice = 0.15;
      if (symbol === 'SHIB' || symbol === 'PEPE') basePrice = 0.00001;
      
      const isStablecoin = symbol === 'USDT' || symbol === 'USDC' || symbol === 'DAI';
      
      return {
        symbol: `${symbol}/USD`,
        name: symbol === 'BTC' ? 'Bitcoin' : symbol === 'ETH' ? 'Ethereum' : `${symbol} Network`,
        basePrice,
        volatility: isStablecoin ? 0.0001 : Math.random() * 0.02 + 0.005
      };
    });

    const now = Date.now();
    symbols.forEach((s) => {
      const history: PricePoint[] = [];
      let currentPrice = s.basePrice;
      
      // Generate 100 past data points
      for (let i = 100; i >= 0; i--) {
        const change = currentPrice * (Math.random() * s.volatility * 2 - s.volatility);
        const open = currentPrice;
        const close = currentPrice + change;
        const high = Math.max(open, close) + Math.abs(change) * Math.random();
        const low = Math.min(open, close) - Math.abs(change) * Math.random();
        
        history.push({
          time: now - i * 60000, // 1 minute intervals
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000,
        });
        currentPrice = close;
      }

      // Calculate indicators for history
      this.calculateIndicatorsForHistory(history);

      // Calculate simple support/resistance based on recent history
      const recentHighs = history.slice(-this.config.lookbackPeriod).map(p => p.high);
      const recentLows = history.slice(-this.config.lookbackPeriod).map(p => p.low);
      const resistance = Math.max(...recentHighs);
      const support = Math.min(...recentLows);

      this.assets[s.symbol] = {
        symbol: s.symbol,
        name: s.name,
        currentPrice,
        support,
        resistance,
        history,
        orderBook: this.generateOrderBook(currentPrice, s.volatility),
        indicators: {
          sma: history[history.length - 1].sma || currentPrice,
          rsi: history[history.length - 1].rsi || 50,
        }
      };
    });
  }

  private calculateIndicatorsForHistory(history: PricePoint[]) {
    // SMA
    for (let i = 0; i < history.length; i++) {
      if (i >= this.config.smaPeriod - 1) {
        const slice = history.slice(i - (this.config.smaPeriod - 1), i + 1);
        const sum = slice.reduce((acc, p) => acc + p.close, 0);
        history[i].sma = sum / this.config.smaPeriod;
      }
    }

    // RSI
    let gains = 0;
    let losses = 0;
    const period = this.config.rsiPeriod;

    for (let i = 1; i < history.length; i++) {
      const diff = history[i].close - history[i - 1].close;
      if (i <= period) {
        if (diff > 0) gains += diff;
        else losses -= diff;

        if (i === period) {
          let avgGain = gains / period;
          let avgLoss = losses / period;
          let rs = avgGain / avgLoss;
          history[i].rsi = 100 - (100 / (1 + rs));
        }
      } else {
        const currentGain = diff > 0 ? diff : 0;
        const currentLoss = diff < 0 ? -diff : 0;

        // Wilders smoothing
        const prevAvgGain = (history[i - 1].rsi === undefined) ? gains / period : (gains * (period - 1) + currentGain) / period; // This is wrong, need to store avgGain/Loss separately for smoothing
        // Simplifying for simulation: using simple moving average of gains/losses for RSI
        const slice = history.slice(i - period, i + 1);
        let sGain = 0;
        let sLoss = 0;
        for (let j = 1; j < slice.length; j++) {
          const d = slice[j].close - slice[j - 1].close;
          if (d > 0) sGain += d;
          else sLoss -= d;
        }
        const rs = (sGain / period) / (sLoss / period);
        history[i].rsi = sLoss === 0 ? 100 : 100 - (100 / (1 + rs));
      }
    }
  }

  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.tick();

      // AI check every 15 ticks (30 seconds)
      if (Math.random() < 0.07) {
        this.generateAIAdvice();
      }
    }, 2000); // 2 seconds per tick for simulation
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async generateAIAdvice() {
    if (!this.genAI) return;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const btc = this.assets['BTC/USD'];
      const eth = this.assets['ETH/USD'];

      const prompt = `You are a professional quant trader. Analyze these current simulated market conditions:
      BTC/USD: ${btc.currentPrice.toFixed(2)}, RSI: ${btc.indicators.rsi.toFixed(2)}, SMA20: ${btc.indicators.sma.toFixed(2)}
      ETH/USD: ${eth.currentPrice.toFixed(2)}, RSI: ${eth.indicators.rsi.toFixed(2)}, SMA20: ${eth.indicators.sma.toFixed(2)}
      
      Provide a concise 1-2 sentence market commentary and a sentiment. Respond in JSON format:
      { "sentiment": "BULLISH" | "BEARISH" | "NEUTRAL", "commentary": "...", "confidence": 0-1 }`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Basic JSON extraction from markdown if needed
      const jsonStr = text.match(/\{.*\}/s)?.[0] || text;
      const data = JSON.parse(jsonStr);

      const insight: AIInsight = {
        sentiment: data.sentiment,
        commentary: data.commentary,
        confidence: data.confidence,
        timestamp: Date.now()
      };

      this.aiInsights = [insight, ...this.aiInsights].slice(0, 10);
      this.notifyListeners();
    } catch (error) {
      console.error("Gemini AI Analysis failed:", error);
    }
  }

  private tick() {
    const now = Date.now();
    let updated = false;

    const newAssets: Record<string, Asset> = {};

    Object.values(this.assets).forEach((asset) => {
      const volatility = asset.symbol === 'BTC/USD' ? 0.001 : asset.symbol === 'ETH/USD' ? 0.002 : 0.004;
      const change = asset.currentPrice * (Math.random() * volatility * 2 - volatility);
      const newPrice = asset.currentPrice + change;
      
      // Update history
      const history = [...asset.history];
      const lastPoint = history[history.length - 1];
      if (now - lastPoint.time > 60000) {
        // New minute candle
        history.push({
          time: now,
          open: newPrice,
          high: newPrice,
          low: newPrice,
          close: newPrice,
          volume: Math.random() * 100,
        });
        if (history.length > 100) history.shift();

        // Recalculate support and resistance on new candle based on lookback period
        const recentHighs = history.slice(-this.config.lookbackPeriod).map(p => p.high);
        const recentLows = history.slice(-this.config.lookbackPeriod).map(p => p.low);
        asset.resistance = Math.max(...recentHighs);
        asset.support = Math.min(...recentLows);
      } else {
        // Update current candle
        history[history.length - 1] = {
          ...lastPoint,
          close: newPrice,
          high: Math.max(lastPoint.high, newPrice),
          low: Math.min(lastPoint.low, newPrice),
          volume: lastPoint.volume + Math.random() * 10,
        };
      }

      let newSupport = asset.support;
      let newResistance = asset.resistance;

      // Check for breakouts
      const threshold = this.config.breakoutThreshold / 100;
      const avgVolume = history.slice(-10).reduce((acc, p) => acc + p.volume, 0) / 10;
      const isVolumeConfirmed = asset.history[asset.history.length - 1].volume > avgVolume * this.config.volumeThreshold;

      if (newPrice > asset.resistance * (1 + threshold) && isVolumeConfirmed) {
        this.emitSignal(asset.symbol, 'BREAKOUT_UP', newPrice);
        newResistance = newPrice * 1.02; // Adjust resistance up
        newSupport = newPrice * 0.98;
      } else if (newPrice < asset.support * (1 - threshold) && isVolumeConfirmed) {
        this.emitSignal(asset.symbol, 'BREAKOUT_DOWN', newPrice);
        newSupport = newPrice * 0.98; // Adjust support down
        newResistance = newPrice * 1.02;
      }

      // Update Indicators for the asset
      this.calculateIndicatorsForHistory(history);

      newAssets[asset.symbol] = {
        ...asset,
        currentPrice: newPrice,
        history,
        support: newSupport,
        resistance: newResistance,
        orderBook: this.generateOrderBook(newPrice, volatility),
        indicators: {
          sma: history[history.length - 1].sma || newPrice,
          rsi: history[history.length - 1].rsi || 50,
        }
      };

      updated = true;
    });

    this.assets = newAssets;

    // Manage open trades
    this.trades = this.trades.map(trade => {
      if (trade.status !== 'OPEN') return trade;

      const currentPrice = this.assets[trade.symbol].currentPrice;
      const pnl = trade.type === 'LONG' 
        ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100
        : ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100;
      
      const pnlUsd = (pnl / 100) * trade.size;
      
      const updatedTrade = { ...trade, pnl, pnlUsd };

      // Simple take profit / stop loss
      if (pnl > this.config.takeProfit || pnl < -this.config.stopLoss) {
        trade.status = 'CLOSED';
        trade.exitPrice = currentPrice;
        this.updateMetrics();
      }

      return updatedTrade;
    });

    if (updated) {
      this.notifyListeners();
    }
  }

  private updateMetrics() {
    const closedTrades = this.trades.filter(t => t.status === 'CLOSED');
    if (closedTrades.length === 0) return;

    const profitableTrades = closedTrades.filter(t => (t.pnl || 0) > 0);
    const winRate = (profitableTrades.length / closedTrades.length) * 100;

    // Calc max drawdown (simplified)
    let peak = -Infinity;
    let maxDrawdown = 0;
    let balance = 100000; // start virtual balance
    closedTrades.sort((a, b) => a.timestamp - b.timestamp).forEach(t => {
      balance += (t.pnlUsd || 0);
      if (balance > peak) peak = balance;
      const dd = (peak - balance) / peak * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    this.metrics = {
      winRate,
      totalTrades: closedTrades.length,
      profitableTrades: profitableTrades.length,
      maxDrawdown,
      sharpeRatio: winRate / 10 // ultra-simplified sharpe for simulation
    };
  }

  private emitSignal(symbol: string, type: 'BREAKOUT_UP' | 'BREAKOUT_DOWN', price: number) {
    const signal: Signal = {
      id: Math.random().toString(36).substring(7),
      symbol,
      type,
      price,
      timestamp: Date.now(),
    };
    this.signals = [signal, ...this.signals].slice(0, 50);

    // Auto-trade on signal
    if (this.config.autoTrade) {
      this.executeTrade(symbol, type === 'BREAKOUT_UP' ? 'LONG' : 'SHORT', price);
    }
  }

  private executeTrade(symbol: string, type: 'LONG' | 'SHORT', price: number) {
    // Check if already have an open trade for this symbol
    if (this.trades.some(t => t.symbol === symbol && t.status === 'OPEN')) return;

    const size = 1000; // Default $1000 position size

    const trade: Trade = {
      id: Math.random().toString(36).substring(7),
      symbol,
      type,
      entryPrice: price,
      status: 'OPEN',
      timestamp: Date.now(),
      pnl: 0,
      pnlUsd: 0,
      size,
    };
    this.trades = [trade, ...this.trades];
  }

  public subscribe(listener: (state: SimulationState) => void) {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(l => l(state));
  }

  public getState(): SimulationState {
    const totalPnlUsd = this.trades.reduce((sum, trade) => sum + (trade.pnlUsd || 0), 0);
    return {
      assets: { ...this.assets },
      trades: [...this.trades],
      signals: [...this.signals],
      aiInsights: [...this.aiInsights],
      metrics: { ...this.metrics },
      totalPnlUsd,
      config: { ...this.config },
    };
  }
}

export interface SimulationState {
  assets: Record<string, Asset>;
  trades: Trade[];
  signals: Signal[];
  aiInsights: AIInsight[];
  metrics: MetricData;
  totalPnlUsd: number;
  config: SimulationConfig;
}

export const simulation = new TradingSimulation();
