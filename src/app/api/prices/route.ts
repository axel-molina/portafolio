import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// In-memory cache (resets on server restart)
interface CacheEntry {
  prices: Record<string, { currentPrice: number; change24h: number; changePercent: number; lastUpdated: string }>;
  timestamp: number;
}

let priceCache: CacheEntry | null = null;
let requestCount = 0;
let lastRequestDate = new Date().toDateString();

// Cache duration: 4 hours (allows ~3 API calls per day)
const CACHE_DURATION = 4 * 60 * 60 * 1000;
// Maximum requests per day
const MAX_DAILY_REQUESTS = 3;

function resetDailyLimit() {
  const today = new Date().toDateString();
  if (lastRequestDate !== today) {
    requestCount = 0;
    lastRequestDate = today;
  }
}

function canMakeRequest(): boolean {
  resetDailyLimit();
  return requestCount < MAX_DAILY_REQUESTS;
}

// Mock fallback data
const MOCK_STOCK_PRICES: Record<string, { price: number; change: number }> = {
  AAPL: { price: 178.72, change: 2.34 },
  GOOGL: { price: 141.80, change: -1.25 },
  MSFT: { price: 417.88, change: 3.56 },
  AMZN: { price: 186.49, change: 1.89 },
  META: { price: 502.30, change: 5.67 },
  NVDA: { price: 875.28, change: 12.45 },
  TSLA: { price: 248.42, change: -4.32 },
  JPM: { price: 198.50, change: 2.10 },
  V: { price: 279.32, change: 0.98 },
  SPY: { price: 502.50, change: 3.25 },
  QQQ: { price: 438.90, change: 2.45 },
};

const MOCK_CRYPTO_PRICES: Record<string, { price: number; change: number }> = {
  BTC: { price: 69420.00, change: 1234.56 },
  ETH: { price: 3456.78, change: -89.12 },
  SOL: { price: 145.67, change: 8.90 },
  XRP: { price: 0.5678, change: -0.0234 },
  DOGE: { price: 0.1234, change: 0.0089 },
  AVAX: { price: 35.67, change: 2.34 },
};

const MOCK_CEDEAR_PRICES: Record<string, { price: number; change: number }> = {
  CEPU: { price: 23.45, change: 0.89 },
  GGAL: { price: 45.67, change: -1.23 },
  YPFD: { price: 12.34, change: 0.56 },
  PAMP: { price: 34.56, change: 1.78 },
};

function isCrypto(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('USD')) return true;
  const cryptoList = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'BNB', 'ADA', 'DOT', 'LINK', 'UNI', 'LTC'];
  return cryptoList.some(c => upper.startsWith(c));
}

async function fetchFromAlphaVantage(ticker: string): Promise<{ currentPrice: number; change24h: number; changePercent: number } | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  try {
    const symbol = ticker.replace('-USD', '').toUpperCase();
    let url: string;

    if (isCrypto(ticker)) {
      url = `${BASE_URL}?function=CRYPTO_INTRADAY&symbol=${symbol}&market=USD&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`;
    } else {
      url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      const price = parseFloat(quote['05. price'] || quote['02. open']);
      const change = parseFloat(quote['09. change'] || '0');
      const changePercent = parseFloat(quote['10. change percent']?.replace('%', '') || '0');

      if (price > 0) {
        console.log(`[AlphaVantage] ${ticker}: $${price}`);
        return { currentPrice: price, change24h: change, changePercent };
      }
    } else if (data['Time Series (CryptoIntraday)']) {
      const timeSeries = data['Time Series (CryptoIntraday)'];
      const times = Object.keys(timeSeries);
      if (times.length > 0) {
        const latest = timeSeries[0];
        const price = parseFloat(timeSeries[latest]['4. close']);
        const prevTimes = times.slice(1);
        const prev = prevTimes.length > 0 ? parseFloat(timeSeries[prevTimes[0]]['4. close']) : price;
        const change = price - prev;
        const changePercent = prev > 0 ? (change / prev) * 100 : 0;

        console.log(`[AlphaVantage] ${ticker}: $${price}`);
        return { currentPrice: price, change24h: change, changePercent };
      }
    }

    console.log(`[AlphaVantage] ${ticker}: No data`);
    return null;
  } catch (error) {
    console.log(`[AlphaVantage Error] ${ticker}: ${error instanceof Error ? error.message : 'Unknown'}`);
    return null;
  }
}

function getMockPrice(ticker: string): { currentPrice: number; change24h: number; changePercent: number } | null {
  const upper = ticker.toUpperCase().replace('-USD', '');
  let mockData: { price: number; change: number } | undefined;

  if (MOCK_STOCK_PRICES[upper]) {
    mockData = MOCK_STOCK_PRICES[upper];
  } else if (MOCK_CRYPTO_PRICES[upper]) {
    mockData = MOCK_CRYPTO_PRICES[upper];
  } else if (MOCK_CEDEAR_PRICES[upper]) {
    mockData = MOCK_CEDEAR_PRICES[upper];
  }

  if (mockData) {
    const changePercent = (mockData.change / (mockData.price - mockData.change)) * 100;
    return {
      currentPrice: mockData.price,
      change24h: mockData.change,
      changePercent: parseFloat(changePercent.toFixed(2)),
    };
  }

  return null;
}

// Check if cache is still valid
function isCacheValid(tickers: string[]): boolean {
  if (!priceCache) return false;
  if (Date.now() - priceCache.timestamp > CACHE_DURATION) return false;

  // Check if all requested tickers are in cache
  return tickers.every(t => priceCache!.prices[t.toUpperCase()]);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tickers = searchParams.get('tickers');
  const forceRefresh = searchParams.get('force') === 'true';

  if (!tickers) {
    return NextResponse.json({ error: 'Missing tickers parameter' }, { status: 400 });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);

  // Check if cache is valid (unless force refresh)
  if (!forceRefresh && isCacheValid(tickerList)) {
    console.log('[Price API] Using cached prices');
    return NextResponse.json(priceCache!.prices);
  }

  // Check if we can make a new request
  if (!forceRefresh && !canMakeRequest()) {
    if (priceCache) {
      console.log('[Price API] Daily limit reached, using cached prices');
      return NextResponse.json(priceCache.prices);
    }
    return NextResponse.json({
      error: 'Daily API limit reached. Try again tomorrow.',
      limit: MAX_DAILY_REQUESTS,
      used: requestCount
    }, { status: 429 });
  }

  // Make API request
  requestCount++;
  console.log(`[Price API] Making API request (${requestCount}/${MAX_DAILY_REQUESTS})`);

  const prices: Record<string, { currentPrice: number; change24h: number; changePercent: number; lastUpdated: string }> = {};

  for (const ticker of tickerList) {
    const priceData = await fetchFromAlphaVantage(ticker);

    if (priceData && priceData.currentPrice > 0) {
      prices[ticker] = {
        ...priceData,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      const mockData = getMockPrice(ticker);
      if (mockData) {
        prices[ticker] = {
          ...mockData,
          lastUpdated: new Date().toISOString(),
        };
        console.log(`[Mock Fallback] ${ticker}: $${mockData.currentPrice}`);
      }
    }
  }

  // Update cache
  priceCache = {
    prices,
    timestamp: Date.now(),
  };

  const response: Record<string, any> = { ...prices };
  response._meta = {
    requestsUsed: requestCount,
    requestsLeft: MAX_DAILY_REQUESTS - requestCount,
    cached: false,
  };

  return NextResponse.json(response);
}