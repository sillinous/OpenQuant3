export interface PricePoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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

class TradingSimulation {
  private assets: Record<string, Asset> = {};
  private trades: Trade[] = [];
  private signals: Signal[] = [];
  private listeners: ((state: SimulationState) => void)[] = [];
  private intervalId: any = null;

  constructor() {
    this.initializeAssets();
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

      // Calculate simple support/resistance based on recent history
      const recentHighs = history.slice(-20).map(p => p.high);
      const recentLows = history.slice(-20).map(p => p.low);
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
      };
    });
  }

  public start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      this.tick();
    }, 2000); // 2 seconds per tick for simulation
  }

  public stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
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
      if (newPrice > asset.resistance * 1.001) {
        this.emitSignal(asset.symbol, 'BREAKOUT_UP', newPrice);
        newResistance = newPrice * 1.02; // Adjust resistance up
        newSupport = newPrice * 0.98;
      } else if (newPrice < asset.support * 0.999) {
        this.emitSignal(asset.symbol, 'BREAKOUT_DOWN', newPrice);
        newSupport = newPrice * 0.98; // Adjust support down
        newResistance = newPrice * 1.02;
      }

      newAssets[asset.symbol] = {
        ...asset,
        currentPrice: newPrice,
        history,
        support: newSupport,
        resistance: newResistance,
        orderBook: this.generateOrderBook(newPrice, volatility),
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
      if (pnl > 2 || pnl < -1) {
        updatedTrade.status = 'CLOSED';
        updatedTrade.exitPrice = currentPrice;
      }

      return updatedTrade;
    });

    if (updated) {
      this.notifyListeners();
    }
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
    this.executeTrade(symbol, type === 'BREAKOUT_UP' ? 'LONG' : 'SHORT', price);
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
      totalPnlUsd,
    };
  }
}

export interface SimulationState {
  assets: Record<string, Asset>;
  trades: Trade[];
  signals: Signal[];
  totalPnlUsd: number;
}

export const simulation = new TradingSimulation();
