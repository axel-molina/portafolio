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

// Cache duration: 4 hours
const CACHE_DURATION = 4 * 60 * 60 * 1000;
// Maximum requests per day
const MAX_DAILY_REQUESTS = 25;

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
    return NextResponse.json(priceCache!.prices);
  }

  // Check if we can make a new request
  if (!forceRefresh && !canMakeRequest()) {
    if (priceCache) {
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

  const prices: Record<string, { currentPrice: number; change24h: number; changePercent: number; lastUpdated: string }> = {};

  for (const ticker of tickerList) {
    const priceData = await fetchFromAlphaVantage(ticker);

    if (priceData && priceData.currentPrice > 0) {
      prices[ticker] = {
        ...priceData,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      console.log(`[Price API] No data available for ${ticker}`);
    }
  }

  // Only update cache if we got at least one price
  if (Object.keys(prices).length > 0) {
    priceCache = {
      prices,
      timestamp: Date.now(),
    };
  }

  const response: Record<string, any> = { ...prices };
  response._meta = {
    requestsUsed: requestCount,
    requestsLeft: MAX_DAILY_REQUESTS - requestCount,
    cached: false,
  };

  // If no prices found
  if (Object.keys(prices).length === 0) {
    return NextResponse.json({ error: 'No prices available. Check ticker symbol.' }, { status: 404 });
  }

  return NextResponse.json(response);
}