import { NextRequest, NextResponse } from 'next/server';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

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

// Determine if ticker is crypto
function isCrypto(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('USD')) return true;
  const cryptoList = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AVAX', 'BNB', 'ADA', 'DOT', 'LINK', 'UNI', 'LTC'];
  return cryptoList.some(c => upper.startsWith(c));
}

// Fetch from Alpha Vantage
async function fetchFromAlphaVantage(ticker: string): Promise<{ currentPrice: number; change24h: number; changePercent: number } | null> {
  if (!ALPHA_VANTAGE_API_KEY) {
    console.log('[AlphaVantage] No API key configured');
    return null;
  }

  try {
    const symbol = ticker.replace('-USD', '').toUpperCase();
    let url: string;

    if (isCrypto(ticker)) {
      // Crypto intraday endpoint
      url = `${BASE_URL}?function=CRYPTO_INTRADAY&symbol=${symbol}&market=USD&interval=5min&apikey=${ALPHA_VANTAGE_API_KEY}`;
    } else {
      // Global quote endpoint for stocks
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
        const latest = timeSeries[times[0]];
        const price = parseFloat(latest['4. close']);
        // Calculate change from previous close
        const prevTimes = Object.keys(timeSeries);
        const prev = prevTimes.length > 1 ? timeSeries[prevTimes[1]]['4. close'] : price;
        const change = price - parseFloat(prev);
        const changePercent = prev > 0 ? (change / parseFloat(prev)) * 100 : 0;

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tickers = searchParams.get('tickers');

  if (!tickers) {
    return NextResponse.json({ error: 'Missing tickers parameter' }, { status: 400 });
  }

  const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
  const prices: Record<string, { currentPrice: number; change24h: number; changePercent: number; lastUpdated: string }> = {};

  // Fetch real prices from Alpha Vantage
  console.log('[Price API] Fetching prices for:', tickerList.join(', '));
  
  for (const ticker of tickerList) {
    const priceData = await fetchFromAlphaVantage(ticker);
    
    if (priceData && priceData.currentPrice > 0) {
      prices[ticker] = {
        ...priceData,
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // Fallback to mock data
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

  if (Object.keys(prices).length === 0) {
    return NextResponse.json({ error: 'No prices available for the requested tickers' }, { status: 404 });
  }

  return NextResponse.json(prices);
}