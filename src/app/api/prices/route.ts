import { NextRequest, NextResponse } from 'next/server';

// Dynamic import for yahoo-finance2 to avoid TypeScript issues
let yahooFinance: any;

async function getYahooFinance() {
  if (!yahooFinance) {
    const yf = await import('yahoo-finance2');
    yahooFinance = yf.default || yf;
  }
  return yahooFinance;
}

// Mock data as fallback
const MOCK_STOCK_PRICES: Record<string, { price: number; change: number }> = {
  // Tech
  AAPL: { price: 178.72, change: 2.34 },
  GOOGL: { price: 141.80, change: -1.25 },
  MSFT: { price: 417.88, change: 3.56 },
  AMZN: { price: 186.49, change: 1.89 },
  META: { price: 502.30, change: 5.67 },
  NVDA: { price: 875.28, change: 12.45 },
  AMD: { price: 177.49, change: 6.78 },
  CRM: { price: 301.23, change: 4.23 },
  NFLX: { price: 628.30, change: -2.15 },
  // Auto & Energy
  TSLA: { price: 248.42, change: -4.32 },
  // Finance
  JPM: { price: 198.50, change: 2.10 },
  BAC: { price: 34.56, change: 0.45 },
  GS: { price: 478.90, change: 3.20 },
  C: { price: 56.78, change: -0.34 },
  V: { price: 279.32, change: 0.98 },
  // Consumer
  DIS: { price: 112.40, change: 1.23 },
  NKE: { price: 98.76, change: -1.56 },
  MCD: { price: 291.45, change: 1.12 },
  WMT: { price: 165.23, change: 0.45 },
  KO: { price: 60.45, change: -0.32 },
  PEP: { price: 173.89, change: 0.67 },
  // Industrial
  BA: { price: 203.15, change: -3.45 },
  // ETF - US Market
  SPY: { price: 502.50, change: 3.25 },
  QQQ: { price: 438.90, change: 2.45 },
  VOO: { price: 498.75, change: 2.80 },
  IVV: { price: 501.20, change: 3.10 },
  DIA: { price: 395.40, change: 1.85 },
  // Crypto-related
  COIN: { price: 234.56, change: 5.67 },
  MSTR: { price: 456.78, change: -12.34 },
  // Semiconductors
  INTC: { price: 43.26, change: -0.89 },
  // AI
  PLTR: { price: 72.45, change: 3.21 },
};

const MOCK_CRYPTO_PRICES: Record<string, { price: number; change: number }> = {
  'BTC-USD': { price: 69420.00, change: 1234.56 },
  'ETH-USD': { price: 3456.78, change: -89.12 },
  BNB: { price: 589.34, change: 12.45 },
  SOL: { price: 145.67, change: 8.90 },
  XRP: { price: 0.5678, change: -0.0234 },
  ADA: { price: 0.4567, change: 0.0123 },
  DOGE: { price: 0.1234, change: 0.0089 },
  AVAX: { price: 35.67, change: 2.34 },
  DOT: { price: 7.89, change: -0.45 },
  MATIC: { price: 0.8901, change: 0.0567 },
  LINK: { price: 18.45, change: 1.23 },
  UNI: { price: 9.87, change: -0.34 },
  ATOM: { price: 8.90, change: 0.56 },
  LTC: { price: 84.56, change: -2.34 },
  SHIB: { price: 0.00002345, change: 0.00000123 },
};

const MOCK_CEDEAR_PRICES: Record<string, { price: number; change: number }> = {
  CEPU: { price: 23.45, change: 0.89 },
  GGAL: { price: 45.67, change: -1.23 },
  YPFD: { price: 12.34, change: 0.56 },
  PAMP: { price: 34.56, change: 1.78 },
  TXAR: { price: 56.78, change: -0.45 },
  LOMA: { price: 23.45, change: 0.67 },
  SUPV: { price: 8.90, change: -0.34 },
  BMA: { price: 34.56, change: 1.23 },
  IRS: { price: 12.34, change: 0.45 },
  IRSA: { price: 11.23, change: -0.56 },
  COME: { price: 5.67, change: 0.23 },
  HARG: { price: 18.90, change: 0.78 },
};

async function fetchRealPrice(ticker: string): Promise<{ currentPrice: number; change24h: number; changePercent: number } | null> {
  try {
    const yf = await getYahooFinance();
    const quote: any = await yf.quote(ticker, { fields: ['regularMarketPrice', 'regularMarketChange', 'regularMarketChangePercent'] });

    if (quote?.regularMarketPrice) {
      console.log(`[REAL] ${ticker}: $${quote.regularMarketPrice}`);
      return {
        currentPrice: quote.regularMarketPrice,
        change24h: quote.regularMarketChange || 0,
        changePercent: quote.regularMarketChangePercent || 0,
      };
    }
    console.log(`[NOT FOUND] ${ticker}: No data from Yahoo`);
    return null;
  } catch (error) {
    console.log(`[ERROR] ${ticker}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return null;
  }
}

function getMockPrice(ticker: string): { currentPrice: number; change24h: number; changePercent: number } | null {
  // Try exact match first
  let mockData: { price: number; change: number } | undefined;

  if (MOCK_STOCK_PRICES[ticker]) {
    mockData = MOCK_STOCK_PRICES[ticker];
  } else if (MOCK_CRYPTO_PRICES[ticker]) {
    mockData = MOCK_CRYPTO_PRICES[ticker];
  } else if (MOCK_CEDEAR_PRICES[ticker]) {
    mockData = MOCK_CEDEAR_PRICES[ticker];
  }

  if (mockData) {
    const changePercent = (mockData.change / (mockData.price - mockData.change)) * 100;
    return {
      currentPrice: mockData.price,
      change24h: mockData.change,
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  }

  // Try without -USD suffix for crypto
  if (ticker.endsWith('-USD')) {
    const baseTicker = ticker.replace('-USD', '');
    if (MOCK_CRYPTO_PRICES[baseTicker]) {
      const md = MOCK_CRYPTO_PRICES[baseTicker];
      const changePercent = (md.change / (md.price - md.change)) * 100;
      return {
        currentPrice: md.price,
        change24h: md.change,
        changePercent: parseFloat(changePercent.toFixed(2)),
      };
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tickers = searchParams.get('tickers');

  if (!tickers) {
    return NextResponse.json({ error: 'Missing tickers parameter' }, { status: 400 });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
  const prices: Record<string, { currentPrice: number; change24h: number; changePercent: number; lastUpdated: string }> = {};

  // Try Yahoo Finance for ALL tickers first
  const fetchPromises = tickerList.map(async (ticker) => {
    const priceData = await fetchRealPrice(ticker);
    return { ticker, priceData };
  });

  const results = await Promise.all(fetchPromises);

  // Process results - use real data if available
  for (const { ticker, priceData } of results) {
    if (priceData && priceData.currentPrice > 0) {
      prices[ticker] = {
        ...priceData,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Use mock data for tickers where Yahoo Finance failed
  for (const ticker of tickerList) {
    if (!prices[ticker]) {
      const mockData = getMockPrice(ticker);
      if (mockData) {
        prices[ticker] = {
          ...mockData,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  }

  // If no prices found at all
  if (Object.keys(prices).length === 0) {
    return NextResponse.json({ error: 'No prices available for the requested tickers' }, { status: 404 });
  }

  return NextResponse.json(prices);
}