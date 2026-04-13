import { NextRequest, NextResponse } from 'next/server';

const CURRENCY_API_KEY = process.env.CURRENCY_API_KEY;
const BASE_URL = 'https://api.currencyapi.com/v3/latest';

// In-memory cache
let rateCache: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  // Check cache
  if (rateCache && Date.now() - rateCache.timestamp < CACHE_DURATION) {
    console.log('[Exchange Rate] Using cached rate:', rateCache.rate);
    return NextResponse.json({
      usdToArs: rateCache.rate,
      cached: true,
    });
  }

  if (!CURRENCY_API_KEY) {
    // Fallback to default rate if no API key
    return NextResponse.json({
      usdToArs: 1200,
      fallback: true,
    });
  }

  try {
    const response = await fetch(
      `${BASE_URL}?apikey=${CURRENCY_API_KEY}&currencies=ARS&base_currency=USD`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.data?.ARS?.value) {
      const rate = data.data.ARS.value;
      rateCache = { rate, timestamp: Date.now() };
      
      console.log('[Exchange Rate] Fetched from API:', rate);
      
      return NextResponse.json({
        usdToArs: rate,
        cached: false,
      });
    }

    throw new Error('No ARS rate in response');
  } catch (error) {
    console.log('[Exchange Rate] Error:', error instanceof Error ? error.message : 'Unknown');
    
    // Fallback to default rate on error
    return NextResponse.json({
      usdToArs: 1200,
      fallback: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}