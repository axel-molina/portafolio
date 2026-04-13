import { AssetPrice } from '@/lib/types';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Exchange rate USD to ARS (actual rate varies daily)
export const USD_TO_ARS_RATE = 1200;

export function useAssetPrices(tickers: string[], autoRefresh = false) {
  const [prices, setPrices] = useState<Record<string, AssetPrice>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ requestsUsed?: number; requestsLeft?: number } | null>(null);
  const isInitialFetch = useRef(true);
  const isFetching = useRef(false);

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
  useEffect(() => {
    isInitialFetch.current = true;
    fetchPrices(tickersKey);
  }, [fetchPrices, tickersKey]);

  return { prices, loading, error, meta, refetch: (force = false) => fetchPrices(tickersKey, force) };
}

export function formatCurrency(value: number, currency: string = 'USD'): string {
  // For ARS, convert from USD
  const displayValue = currency === 'ARS' ? value * USD_TO_ARS_RATE : value;
  
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
