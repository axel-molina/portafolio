export type AssetType = 'stock' | 'crypto' | 'cedear';

export interface Purchase {
  id: string;
  portfolioId: string;
  assetId: string;
  assetTicker: string;
  quantity: number;
  pricePerShare: number;
  date: string;
  fees?: number;
}

export interface Asset {
  id: string;
  portfolioId: string;
  ticker: string;
  name: string;
  type: AssetType;
  totalQuantity: number;
  averagePrice: number;
  totalInvested: number;
  purchases: Purchase[];
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetPrice {
  ticker: string;
  currentPrice: number;
  change24h: number;
  changePercent: number;
  lastUpdated: string;
}

export interface AvailableAsset {
  ticker: string;
  name: string;
  type: AssetType;
}

// DB row interfaces (for InsForge)
export interface DbPortfolio {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPortfolioAsset {
  id: string;
  portfolio_id: string;
  ticker: string;
  name: string;
  asset_type: AssetType;
  total_quantity: number;
  average_price: number;
  total_invested: number;
  created_at: string;
  updated_at: string;
}

export interface DbPurchase {
  id: string;
  portfolio_id: string;
  asset_id: string;
  ticker: string;
  quantity: number;
  price_per_share: number;
  date: string;
  fees: number | null;
  created_at: string;
}

export const AVAILABLE_ASSETS: AvailableAsset[] = [
  // ETFs
  { ticker: 'SPY', name: 'SPDR S&P 500 ETF', type: 'stock' },
  { ticker: 'QQQ', name: 'Invesco QQQ Trust', type: 'stock' },
  { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'stock' },
  { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', type: 'stock' },
  { ticker: 'DIA', name: 'SPDR Dow Jones ETF', type: 'stock' },

  // Stocks
  { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', type: 'stock' },
  { ticker: 'AMZN', name: 'Amazon.com Inc.', type: 'stock' },
  { ticker: 'TSLA', name: 'Tesla Inc.', type: 'stock' },
  { ticker: 'META', name: 'Meta Platforms Inc.', type: 'stock' },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', type: 'stock' },
  { ticker: 'NFLX', name: 'Netflix Inc.', type: 'stock' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', type: 'stock' },
  { ticker: 'INTC', name: 'Intel Corporation', type: 'stock' },
  { ticker: 'DIS', name: 'Walt Disney Company', type: 'stock' },
  { ticker: 'BA', name: 'Boeing Company', type: 'stock' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock' },
  { ticker: 'V', name: 'Visa Inc.', type: 'stock' },
  { ticker: 'WMT', name: 'Walmart Inc.', type: 'stock' },
  { ticker: 'KO', name: 'Coca-Cola Company', type: 'stock' },
  { ticker: 'PEP', name: 'PepsiCo Inc.', type: 'stock' },
  { ticker: 'MCD', name: "McDonald's Corporation", type: 'stock' },
  { ticker: 'NKE', name: 'NIKE Inc.', type: 'stock' },
  { ticker: 'CRM', name: 'Salesforce Inc.', type: 'stock' },
  
  // Crypto
  { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
  { ticker: 'ETH', name: 'Ethereum', type: 'crypto' },
  { ticker: 'BNB', name: 'Binance Coin', type: 'crypto' },
  { ticker: 'SOL', name: 'Solana', type: 'crypto' },
  { ticker: 'XRP', name: 'Ripple', type: 'crypto' },
  { ticker: 'ADA', name: 'Cardano', type: 'crypto' },
  { ticker: 'DOGE', name: 'Dogecoin', type: 'crypto' },
  { ticker: 'AVAX', name: 'Avalanche', type: 'crypto' },
  { ticker: 'DOT', name: 'Polkadot', type: 'crypto' },
  { ticker: 'MATIC', name: 'Polygon', type: 'crypto' },
  { ticker: 'LINK', name: 'Chainlink', type: 'crypto' },
  { ticker: 'UNI', name: 'Uniswap', type: 'crypto' },
  { ticker: 'ATOM', name: 'Cosmos', type: 'crypto' },
  { ticker: 'LTC', name: 'Litecoin', type: 'crypto' },
  { ticker: 'SHIB', name: 'Shiba Inu', type: 'crypto' },
  
  // CEDEARs
  { ticker: 'CEPU', name: 'Central Puerto (CEDEAR)', type: 'cedear' },
  { ticker: 'GGAL', name: 'Grupo Galicia (CEDEAR)', type: 'cedear' },
  { ticker: 'YPFD', name: 'YPF (CEDEAR)', type: 'cedear' },
  { ticker: 'PAMP', name: 'Pampa Energia (CEDEAR)', type: 'cedear' },
  { ticker: 'TXAR', name: 'Ternium Argentina (CEDEAR)', type: 'cedear' },
  { ticker: 'LOMA', name: 'Loma Negra (CEDEAR)', type: 'cedear' },
  { ticker: 'SUPV', name: 'Grupo Supervielle (CEDEAR)', type: 'cedear' },
  { ticker: 'BMA', name: 'Banco Macro (CEDEAR)', type: 'cedear' },
  { ticker: 'IRS', name: 'IRSA Inversiones (CEDEAR)', type: 'cedear' },
  { ticker: 'IRSA', name: 'IRSA Propiedades (CEDEAR)', type: 'cedear' },
  { ticker: 'COME', name: 'Comercial del Plata (CEDEAR)', type: 'cedear' },
  { ticker: 'HARG', name: 'Hargreaves Services (CEDEAR)', type: 'cedear' },
];
