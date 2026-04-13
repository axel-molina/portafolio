import { AssetPrice } from '@/lib/types';
import { useState, useEffect, useCallback, useRef, useMemo, useEffect as useEffect2 } from 'react';

// Default exchange rate (fallback)
let DEFAULT_USD_TO_ARS = 1200;

// Fetch exchange rate on app load
if (typeof window !== 'undefined') {
  fetch('/api/exchange-rate')
    .then(res => res.json())
    .then(data => {
      if (data.usdToArs) {
        DEFAULT_USD_TO_ARS = data.usdToArs;
      }
    })
    .catch(console.error);
}

export function useAssetPrices(tickers: string[], autoRefresh = false) {
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ requestsUsed?: number; requestsLeft?: number } | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number>(DEFAULT_USD_TO_ARS);
  const isInitialFetch = useRef(true);
  const isFetching = useRef(false);

  // Fetch exchange rate
  useEffect(() => {
    fetch('/api/exchange-rate')
      .then(res => res.json())
      .then(data => {
        if (data.usdToArs) {
          setExchangeRate(data.usdToArs);
        }
      })
      .catch(console.error);
  }, []);

  // Memoize tickers string to prevent unnecessary re-renders
  const tickersKey = useMemo(() => tickers.join(','), [tickers]);

  const fetchPrices = useCallback(async (tickersStr: string, force = false) => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      if (!tickersStr) {
        setPrices({});
        setLoading(false);
        isFetching.current = false;
        return;
      }

      // Only show loading on initial fetch
      if (isInitialFetch.current) {
        setLoading(true);
        isInitialFetch.current = false;
      }

      const url = force
        ? `/api/prices?tickers=${tickersStr}&force=true`
        : `/api/prices?tickers=${tickersStr}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data = await response.json();

      // Extract meta info if present
      if (data._meta) {
        setMeta(data._meta);
        delete data._meta;
      }

      const formattedPrices: Record<string, AssetPrice> = {};
      Object.entries(data).forEach(([ticker, priceData]: [string, any]) => {
        formattedPrices[ticker] = {
          ticker,
          currentPrice: priceData.currentPrice,
          change24h: priceData.change24h,
          changePercent: priceData.changePercent,
          lastUpdated: priceData.lastUpdated,
        };
      });

      setPrices(formattedPrices);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    } finally {
      isFetching.current = false;
    }
  }, []);

  // Fetch on mount (only), no auto-refresh to save API calls
  useEffect2(() => {
    isInitialFetch.current = true;
    fetchPrices(tickersKey);
  }, [fetchPrices, tickersKey]);

  return { prices, loading, error, meta, exchangeRate, refetch: (force = false) => fetchPrices(tickersKey, force) };
}

export function formatCurrency(value: number, currency: string = 'USD', exchangeRate = DEFAULT_USD_TO_ARS): string {
  // For ARS, convert from USD using dynamic exchange rate
  const displayValue = currency === 'ARS' ? value * exchangeRate : value;

  return new Intl.NumberFormat(currency === 'ARS' ? 'es-AR' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: displayValue < 1 ? 4 : 2,
    maximumFractionDigits: displayValue < 1 ? 6 : 2,
  }).format(displayValue);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}