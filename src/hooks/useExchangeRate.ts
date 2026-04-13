import { useState, useEffect, useCallback } from 'react';

interface ExchangeRateData {
  rate: number;
  loading: boolean;
  error: string | null;
}

// Default fallback rate
let DEFAULT_EXCHANGE_RATE = 1200;

// Function to get current rate (synchronous, for components that can't use hooks)
export function getExchangeRate(): number {
  return DEFAULT_EXCHANGE_RATE;
}

export function useExchangeRate(): ExchangeRateData {
  const [rate, setRate] = useState<number>(DEFAULT_EXCHANGE_RATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(async () => {
    try {
      const response = await fetch('/api/exchange-rate');
      const data = await response.json();
      
      if (data.usdToArs) {
        DEFAULT_EXCHANGE_RATE = data.usdToArs;
        setRate(data.usdToArs);
      }
      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rate');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  return { rate, loading, error };
}

// Re-export for backwards compatibility
export const USD_TO_ARS_RATE = 1200;