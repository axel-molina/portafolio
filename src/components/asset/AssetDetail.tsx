'use client';

import { usePortfolioStore } from '@/store/portfolioStore';
import { useAssetPrices, formatCurrency, formatPercent, formatDate, USD_TO_ARS_RATE } from '@/hooks/useAssetPrices';
import { AssetType } from '@/lib/types';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Trash2,
  Clock,
  Layers,
} from 'lucide-react';
import { useState } from 'react';

interface AssetDetailProps {
  ticker: string;
  onBack: () => void;
}

const typeColors: Record<AssetType, string> = {
  stock: '#6366f1',
  crypto: '#10b981',
  cedear: '#f59e0b',
};

export function AssetDetail({ ticker, onBack }: AssetDetailProps) {
  const { t } = useTranslation();
  const activeAssets = usePortfolioStore((state) => state.activeAssets);
  const removeAsset = usePortfolioStore((state) => state.removeAsset);
  const asset = activeAssets.find((a) => a.ticker === ticker);
  const { prices } = useAssetPrices([ticker]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!asset) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 24px' }}>
        <p style={{ color: 'var(--color-text-muted)' }}>Asset not found</p>
        <button onClick={onBack} style={{ marginTop: '16px', color: 'var(--color-primary-light)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const priceData = prices[ticker];
  const currentPrice = priceData?.currentPrice || asset.averagePrice;
  const currentValue = asset.totalQuantity * currentPrice;
  const totalProfitLoss = currentValue - asset.totalInvested;
  const profitLossPercent = asset.totalInvested > 0 ? (totalProfitLoss / asset.totalInvested) * 100 : 0;

  const handleDelete = () => {
    removeAsset(asset.id, asset.portfolioId);
    onBack();
  };

  // Mock historical data for chart
  const mockHistoryData = Array.from({ length: 30 }, (_, i) => {
    const basePrice = asset.averagePrice;
    const variation = (Math.random() - 0.4) * basePrice * 0.1;
    return {
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
        month: 'short',
        day: 'numeric',
      }),
      price: parseFloat((basePrice + variation).toFixed(2)),
    };
  });

  const accentColor = typeColors[asset.type];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Back Button */}
      <motion.button
        onClick={onBack}
        whileHover={{ x: -3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-secondary)',
          fontSize: '13px',
          fontWeight: 500,
          padding: '4px 0',
          transition: 'color 0.2s ease',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'; }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back to Dashboard
      </motion.button>

      {/* Asset Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'var(--color-background-card)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 800,
                color: accentColor,
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}33`,
              }}
            >
              {asset.ticker.slice(0, 2)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
                  {asset.ticker}
                </h2>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  background: `${accentColor}18`,
                  color: accentColor,
                }}>
                  {asset.type}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>{asset.name}</p>
            </div>
          </div>

          {!confirmDelete ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setConfirmDelete(true)}
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.1)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-danger)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-background-secondary)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)';
              }}
            >
              <Trash2 style={{ width: '18px', height: '18px', color: 'var(--color-text-muted)' }} />
            </motion.button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--color-background-secondary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDelete}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'var(--color-danger)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
              >
                Delete
              </motion.button>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard
            label="Current Price"
            value={formatCurrency(currentPrice, 'ARS')}
            change={priceData ? formatPercent(priceData.changePercent) : undefined}
            positive={priceData ? priceData.changePercent >= 0 : true}
            icon={<DollarSign style={{ width: '18px', height: '18px' }} />}
          />
          <StatCard
            label="Average Buy Price"
            value={formatCurrency(asset.averagePrice, 'ARS')}
            icon={<TrendingUp style={{ width: '18px', height: '18px' }} />}
          />
          <StatCard
            label="Total Quantity"
            value={asset.totalQuantity.toFixed(asset.totalQuantity < 1 ? 6 : 2)}
            icon={<Layers style={{ width: '18px', height: '18px' }} />}
          />
          <StatCard
            label="Total P&L"
            value={`${totalProfitLoss >= 0 ? '+' : ''}${formatCurrency(totalProfitLoss, 'ARS')}`}
            change={formatPercent(profitLossPercent)}
            positive={totalProfitLoss >= 0}
            icon={totalProfitLoss >= 0 ? <TrendingUp style={{ width: '18px', height: '18px' }} /> : <TrendingDown style={{ width: '18px', height: '18px' }} />}
          />
        </div>
      </motion.div>

      {/* Price Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          background: 'var(--color-background-card)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          padding: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '3px', background: accentColor }} />
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            Price History (30 days)
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={mockHistoryData}>
            <defs>
              <linearGradient id={`gradient-${asset.ticker}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" strokeOpacity={0.5} />
            <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} />
            <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} axisLine={{ stroke: 'var(--color-border)' }} tickFormatter={(v: number) => `$${(v * USD_TO_ARS_RATE).toFixed(0)}`} />
            <Tooltip
              formatter={(value: unknown) => [formatCurrency(value as number, 'ARS'), 'Price']}
              labelStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}
              contentStyle={{
                backgroundColor: 'var(--color-background-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={accentColor}
              strokeWidth={2.5}
              fill={`url(#gradient-${asset.ticker})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Purchase History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        style={{
          background: 'var(--color-background-card)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock style={{ width: '18px', height: '18px', color: 'var(--color-text-muted)' }} />
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Purchase History
            </h3>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            {asset.purchases.length} transaction{asset.purchases.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {asset.purchases
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((purchase, index) => (
              <motion.div
                key={purchase.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, duration: 0.3 }}
                style={{
                  padding: '18px 24px',
                  borderBottom: index < asset.purchases.length - 1 ? '1px solid var(--color-border)' : 'none',
                  transition: 'background 0.15s ease',
                  cursor: 'default',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--color-background-hover)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `${accentColor}18`,
                    }}>
                      <TrendingUp style={{ width: '20px', height: '20px', color: accentColor }} />
                    </div>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {purchase.quantity.toFixed(purchase.quantity < 1 ? 6 : 2)} shares
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar style={{ width: '12px', height: '12px' }} />
                        {formatDate(purchase.date)}
                      </p>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatCurrency(purchase.pricePerShare, 'ARS')}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>
                      Total: {formatCurrency(purchase.quantity * purchase.pricePerShare, 'ARS')}
                    </p>
                    {purchase.fees && purchase.fees > 0 && (
                      <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                        +{formatCurrency(purchase.fees, 'ARS')} fees
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </motion.div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  positive?: boolean;
  icon: React.ReactNode;
}

function StatCard({ label, value, change, positive = true, icon }: StatCardProps) {
  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: '12px',
      border: '1px solid var(--color-border)',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ color: 'var(--color-text-muted)' }}>{icon}</span>
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px', fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </p>
      {change && (
        <p style={{ fontSize: '12px', marginTop: '4px', fontWeight: 600, color: positive ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {change}
        </p>
      )}
    </div>
  );
}
