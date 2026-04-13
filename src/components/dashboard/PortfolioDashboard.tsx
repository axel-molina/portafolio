'use client';

import { useState } from 'react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useAssetPrices, formatCurrency, formatPercent } from '@/hooks/useAssetPrices';
import { AssetType } from '@/lib/types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  ArrowUpRight,
  DollarSign,
} from 'lucide-react';

interface PortfolioDashboardProps {
  onSelectAsset: (ticker: string) => void;
}

const COLORS = ['#6366f1', '#818cf8', '#10b981', '#34d399', '#f59e0b', '#ef4444', '#f87171', '#a78bfa'];

const typeColors: Record<AssetType, string> = {
  stock: '#6366f1',
  crypto: '#10b981',
  cedear: '#f59e0b',
};

export function PortfolioDashboard({ onSelectAsset }: PortfolioDashboardProps) {
  const { t } = useTranslation();
  const assets = usePortfolioStore((state) => state.activeAssets);
  const totalInvested = assets.reduce((sum, a) => sum + a.totalInvested, 0);
  const [displayCurrency, setDisplayCurrency] = useState<'USD' | 'ARS'>('USD');

  const typeLabels = {
    stock: t('dashboard.stocks'),
    crypto: t('dashboard.crypto'),
    cedear: t('dashboard.cedear'),
  };

  const tickers = assets.map(a => a.ticker);
  const { prices, loading, exchangeRate } = useAssetPrices(tickers);

  // Helper to convert price based on display currency
  const getDisplayPrice = (priceUSD: number) => {
    const rate = exchangeRate || 1200;
    return displayCurrency === 'ARS' ? priceUSD * rate : priceUSD;
  };

  // Calculate all values in display currency
  const totalInvestedDisplay = getDisplayPrice(totalInvested);
  let totalCurrentValue = 0;
  let hasPrices = false;
  if (!loading && Object.keys(prices).length > 0) {
    hasPrices = true;
    assets.forEach(asset => {
      const priceData = prices[asset.ticker];
      if (priceData) {
        totalCurrentValue += asset.totalQuantity * getDisplayPrice(priceData.currentPrice);
      }
    });
  }

  // Only show profit/loss when we have prices
  const showProfitLoss = hasPrices && totalCurrentValue > 0;
  const totalProfitLoss = showProfitLoss ? totalCurrentValue - totalInvestedDisplay : 0;
  const profitLossPercent = totalInvestedDisplay > 0 && showProfitLoss ? (totalProfitLoss / totalInvestedDisplay) * 100 : 0;

  const allocationByType = assets.reduce(
    (acc, asset) => {
      const valueUSD = prices[asset.ticker]?.currentPrice
        ? asset.totalQuantity * prices[asset.ticker].currentPrice
        : asset.totalInvested;
      acc[asset.type] = (acc[asset.type] || 0) + getDisplayPrice(valueUSD);
      return acc;
    },
    {} as Record<string, number>
  );

  const allocationData = Object.entries(allocationByType).map(([type, value]) => ({
    name: typeLabels[type as AssetType] || type.toUpperCase(),
    value,
    color: typeColors[type as AssetType],
  }));

  const assetsByValue = assets
    .map(asset => ({
      ticker: asset.ticker,
      name: asset.name,
      value: prices[asset.ticker]?.currentPrice 
        ? asset.totalQuantity * prices[asset.ticker].currentPrice 
        : asset.totalInvested,
      change: prices[asset.ticker]?.changePercent || 0,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Currency Selector */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{
          display: 'flex',
          background: 'var(--color-background-hover)',
          borderRadius: '8px',
          padding: '4px',
          border: '1px solid var(--color-border)',
        }}>
          <button
            onClick={() => setDisplayCurrency('USD')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: displayCurrency === 'USD' ? 'var(--color-primary)' : 'transparent',
              color: displayCurrency === 'USD' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            USD
          </button>
          <button
            onClick={() => setDisplayCurrency('ARS')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: displayCurrency === 'ARS' ? 'var(--color-primary)' : 'transparent',
              color: displayCurrency === 'ARS' ? '#fff' : 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            ARS
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}
      >
        <motion.div variants={item}>
          <SummaryCard
            title={t('assets.totalInvested')}
            value={hasPrices ? formatCurrency(totalInvestedDisplay, displayCurrency, exchangeRate) : totalInvested > 0 ? formatCurrency(totalInvestedDisplay, displayCurrency, exchangeRate) : '—'}
            icon={<Wallet style={{ width: '20px', height: '20px' }} />}
            iconBg="rgba(99, 102, 241, 0.12)"
            iconColor="var(--color-primary-light)"
          />
        </motion.div>

        <motion.div variants={item}>
          <SummaryCard
            title={t('assets.currentValue')}
            value={loading ? '—' : hasPrices ? formatCurrency(totalCurrentValue, displayCurrency, exchangeRate) : '—'}
            icon={<PieChartIcon style={{ width: '20px', height: '20px' }} />}
            iconBg="rgba(16, 185, 129, 0.12)"
            iconColor="var(--color-success)"
          />
        </motion.div>

        <motion.div variants={item}>
          <SummaryCard
            title={t('assets.profitLoss')}
            value={showProfitLoss ? formatCurrency(totalProfitLoss, displayCurrency, exchangeRate) : '—'}
            change={showProfitLoss ? formatPercent(profitLossPercent) : undefined}
            icon={totalProfitLoss >= 0 ? <TrendingUp style={{ width: '20px', height: '20px' }} /> : <TrendingDown style={{ width: '20px', height: '20px' }} />}
            iconBg={totalProfitLoss >= 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'}
            iconColor={totalProfitLoss >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}
          />
        </motion.div>

        <motion.div variants={item}>
          <SummaryCard
            title="Total Assets"
            value={assets.length.toString()}
            icon={<ArrowUpRight style={{ width: '20px', height: '20px' }} />}
            iconBg="rgba(245, 158, 11, 0.12)"
            iconColor="var(--color-warning)"
          />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      {assets.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}
        >
          <ChartCard title={t('dashboard.allocationByType')}>
            {allocationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={allocationData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    fill="#8884d8"
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {allocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: unknown) => formatCurrency(value as number, displayCurrency, exchangeRate)}
                    contentStyle={{
                      backgroundColor: 'var(--color-background-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                No data available
              </div>
            )}
            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '8px' }}>
              {allocationData.map((entry) => (
                <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: entry.color }} />
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{entry.name}</span>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard title="Top Assets by Value">
            {assetsByValue.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={assetsByValue} barSize={40}>
                  <XAxis 
                    dataKey="ticker" 
                    stroke="var(--color-text-muted)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <YAxis 
                    stroke="var(--color-text-muted)"
                    fontSize={12}
                    tickFormatter={(value: number) => `$${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value.toFixed(0)}`}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--color-border)' }}
                  />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [
                      name === 'value' ? formatCurrency(value as number, displayCurrency, exchangeRate) : formatPercent(value as number),
                      name === 'value' ? 'Value' : 'Change'
                    ]}
                    contentStyle={{
                      backgroundColor: 'var(--color-background-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary-light)" />
                      <stop offset="100%" stopColor="var(--color-primary)" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                No data available
              </div>
            )}
          </ChartCard>
        </motion.div>
      )}

      {/* Assets Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        style={{
          background: 'var(--color-background-card)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Your Assets</h3>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {assets.length} asset{assets.length !== 1 ? 's' : ''} in your portfolio
          </p>
        </div>

        {assets.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'var(--color-background-hover)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <PieChartIcon style={{ width: '28px', height: '28px', color: 'var(--color-text-muted)' }} />
            </div>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>No assets yet</p>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Click &quot;Add Asset&quot; to get started!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Asset', 'Quantity', 'Avg. Price', 'Current Price', 'Value', 'P&L'].map((header) => (
                    <th key={header} style={{
                      padding: '14px 24px',
                      textAlign: header === 'Asset' ? 'left' : 'right',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.8px',
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assets.map((asset, idx) => {
                  const priceData = hasPrices ? prices[asset.ticker] : null;
                  const currentPrice = priceData?.currentPrice || asset.averagePrice;
                  const currentValue = asset.totalQuantity * currentPrice;
                  const hasPriceData = hasPrices && priceData !== null && priceData !== undefined;
                  const profitLoss = hasPriceData ? currentValue - asset.totalInvested : 0;
                  const profitLossPercent = hasPriceData && asset.totalInvested > 0 ? (profitLoss / asset.totalInvested) * 100 : 0;

                  return (
                    <motion.tr
                      key={asset.ticker}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => onSelectAsset(asset.ticker)}
                      style={{
                        borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'var(--color-background-hover)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div 
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#fff',
                              background: `${typeColors[asset.type]}22`,
                              border: `1px solid ${typeColors[asset.type]}44`,
                            }}
                          >
                            <span style={{ color: typeColors[asset.type] }}>{asset.ticker.slice(0, 2)}</span>
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontSize: '14px' }}>{asset.ticker}</p>
                            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '1px' }}>{asset.name}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                        {asset.totalQuantity.toFixed(asset.totalQuantity < 1 ? 6 : 2)}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                        {formatCurrency(asset.averagePrice, displayCurrency, exchangeRate)}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                          {hasPriceData ? formatCurrency(currentPrice, displayCurrency, exchangeRate) : formatCurrency(asset.averagePrice, displayCurrency, exchangeRate)}
                        </p>
                        {priceData && (
                          <p style={{ fontSize: '11px', marginTop: '2px', color: priceData.changePercent >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 500 }}>
                            {formatPercent(priceData.changePercent)}
                          </p>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                        {hasPriceData ? formatCurrency(currentValue, displayCurrency, exchangeRate) : '—'}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: hasPriceData && profitLoss >= 0 ? 'var(--color-success)' : hasPriceData ? 'var(--color-danger)' : 'var(--color-text-muted)', fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' }}>
                          {hasPriceData ? formatCurrency(profitLoss, displayCurrency, exchangeRate) : '—'}
                        </p>
                        {hasPriceData && (
                          <p style={{ fontSize: '11px', marginTop: '2px', color: profitLossPercent >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 500 }}>
                            {formatPercent(profitLossPercent)}
                          </p>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string;
  change?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function SummaryCard({ title, value, change, icon, iconBg, iconColor }: SummaryCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      style={{
        background: 'var(--color-background-card)',
        borderRadius: '14px',
        border: '1px solid var(--color-border)',
        padding: '22px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: '8px' }}>{title}</p>
          <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px', lineHeight: 1.1 }}>{value}</p>
          {change && <p style={{ fontSize: '12px', marginTop: '6px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>{change}</p>}
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: iconColor,
        }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

function ChartCard({ title, children }: ChartCardProps) {
  return (
    <div style={{
      background: 'var(--color-background-card)',
      borderRadius: '14px',
      border: '1px solid var(--color-border)',
      padding: '24px',
    }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '20px' }}>{title}</h3>
      {children}
    </div>
  );
}
