'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { AVAILABLE_ASSETS, AvailableAsset, AssetType } from '@/lib/types';
import { USD_TO_ARS_RATE } from '@/hooks/useExchangeRate';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Search, X, Check, DollarSign, Hash, Calendar, Receipt, ArrowLeft } from 'lucide-react';

interface AddAssetFormProps {
  onSuccess: () => void;
  portfolioId: string;
}

export function AddAssetForm({ onSuccess, portfolioId }: AddAssetFormProps) {
  const { t } = useTranslation();
  const addPurchase = usePortfolioStore((state) => state.addPurchase);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AvailableAsset | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [pricePerShare, setPricePerShare] = useState('');
  const [priceCurrency, setPriceCurrency] = useState<'USD' | 'ARS'>('USD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [fees, setFees] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAssets = useMemo(() => {
    if (!searchTerm) return AVAILABLE_ASSETS;
    const term = searchTerm.toLowerCase();
    return AVAILABLE_ASSETS.filter(
      (asset) =>
        asset.ticker.toLowerCase().includes(term) ||
        asset.name.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleSelectAsset = (asset: AvailableAsset) => {
    setSelectedAsset(asset);
    setSearchTerm(`${asset.ticker} — ${asset.name}`);
    setShowDropdown(false);
    setErrors(prev => ({ ...prev, asset: '' }));
  };

  const handleClearSelection = () => {
    setSelectedAsset(null);
    setSearchTerm('');
    setShowDropdown(true);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!selectedAsset) newErrors.asset = t('assets.errors.selectAsset');
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = t('assets.errors.quantityPositive');
    if (!pricePerShare || parseFloat(pricePerShare) <= 0) newErrors.price = t('assets.errors.pricePositive');
    if (!date) newErrors.date = t('assets.errors.dateRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !selectedAsset) return;

    // Convert ARS to USD if selected
    const priceInUSD = priceCurrency === 'ARS' 
      ? parseFloat(pricePerShare) / USD_TO_ARS_RATE 
      : parseFloat(pricePerShare);

    setIsSubmitting(true);
    addPurchase(
      portfolioId,
      selectedAsset.ticker,
      selectedAsset.name,
      selectedAsset.type,
      parseFloat(quantity),
      priceInUSD,
      new Date(date).toISOString(),
      fees ? parseFloat(fees) : undefined
    );

    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 400);
  };

  const getTypeBadge = (type: AssetType) => {
    const styles: Record<AssetType, { bg: string; color: string }> = {
      stock: { bg: 'rgba(99, 102, 241, 0.12)', color: 'var(--color-primary-light)' },
      crypto: { bg: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-success)' },
      cedear: { bg: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-warning)' },
    };
    const s = styles[type];
    return (
      <span style={{
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        background: s.bg,
        color: s.color,
      }}>
        {type}
      </span>
    );
  };

  const totalCost = quantity && pricePerShare ? parseFloat(quantity) * parseFloat(pricePerShare) : 0;
  const totalFees = fees ? parseFloat(fees) : 0;
  const grandTotal = totalCost + totalFees;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ maxWidth: '640px', margin: '0 auto' }}
    >
      {/* Back Button */}
      <motion.button
        onClick={onSuccess}
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
          padding: '0 0 16px 0',
          marginBottom: '8px',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)'; }}
      >
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        Back to Dashboard
      </motion.button>

      <div style={{
        background: 'var(--color-background-card)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        padding: '32px',
      }}>
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
            Register New Purchase
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Fill in the details of your asset purchase
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Asset Search */}
          <div ref={searchRef}>
            <label style={labelStyle}>Asset</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                <Search style={{ width: '18px', height: '18px' }} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                  if (selectedAsset) {
                    setSelectedAsset(null);
                  }
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder={t('assets.searchPlaceholder')}
                style={{
                  ...inputStyle,
                  paddingLeft: '44px',
                  paddingRight: selectedAsset ? '40px' : '14px',
                  borderColor: errors.asset ? 'var(--color-danger)' : 'var(--color-border)',
                }}
              />
              {selectedAsset && (
                <button
                  type="button"
                  onClick={handleClearSelection}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--color-text-muted)',
                    display: 'flex',
                    padding: 0,
                  }}
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              )}

              <AnimatePresence>
                {showDropdown && !selectedAsset && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      zIndex: 50,
                      marginTop: '8px',
                      width: '100%',
                      background: 'var(--color-background-card)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      maxHeight: '280px',
                      overflowY: 'auto',
                      boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
                    }}
                  >
                    {filteredAssets.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                        No assets found
                      </div>
                    ) : (
                      <div style={{ padding: '6px' }}>
                        {filteredAssets.slice(0, 15).map((asset) => (
                          <button
                            key={asset.ticker}
                            type="button"
                            onClick={() => handleSelectAsset(asset)}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              background: 'transparent',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              transition: 'background 0.12s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-background-hover)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: 'rgba(99, 102, 241, 0.12)',
                                color: 'var(--color-primary-light)',
                              }}>
                                {asset.ticker.slice(0, 2)}
                              </div>
                              <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{asset.ticker}</p>
                                <p style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{asset.name}</p>
                              </div>
                            </div>
                            {getTypeBadge(asset.type)}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {errors.asset && <p style={errorStyle}>{errors.asset}</p>}
          </div>

          {/* Quantity and Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>{t('assets.quantity')}</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                  <Hash style={{ width: '16px', height: '16px' }} />
                </div>
                <input
                  type="number"
                  step="any"
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setErrors(p => ({ ...p, quantity: '' })); }}
                  placeholder="0.00"
                  style={{
                    ...inputStyle,
                    paddingLeft: '42px',
                    borderColor: errors.quantity ? 'var(--color-danger)' : 'var(--color-border)',
                  }}
                />
              </div>
              {errors.quantity && <p style={errorStyle}>{errors.quantity}</p>}
            </div>

            <div>
              <label style={labelStyle}>{t('assets.pricePerShare')}</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                    <DollarSign style={{ width: '16px', height: '16px' }} />
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={pricePerShare}
                    onChange={(e) => { setPricePerShare(e.target.value); setErrors(p => ({ ...p, price: '' })); }}
                    placeholder="0.00"
                    style={{
                      ...inputStyle,
                      paddingLeft: '42px',
                      borderColor: errors.price ? 'var(--color-danger)' : 'var(--color-border)',
                    }}
                  />
                </div>
                <select
                  value={priceCurrency}
                  onChange={(e) => setPriceCurrency(e.target.value as 'USD' | 'ARS')}
                  style={{
                    ...inputStyle,
                    width: '90px',
                    paddingLeft: '8px',
                    backgroundColor: 'var(--color-background)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              {errors.price && <p style={errorStyle}>{errors.price}</p>}
            </div>
          </div>

          {/* Date and Fees */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>{t('assets.purchaseDate')}</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                  <Calendar style={{ width: '16px', height: '16px' }} />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })); }}
                  style={{
                    ...inputStyle,
                    paddingLeft: '42px',
                    borderColor: errors.date ? 'var(--color-danger)' : 'var(--color-border)',
                  }}
                />
              </div>
              {errors.date && <p style={errorStyle}>{errors.date}</p>}
            </div>

            <div>
              <label style={labelStyle}>{t('assets.fees')}</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
                  <Receipt style={{ width: '16px', height: '16px' }} />
                </div>
                <input
                  type="number"
                  step="any"
                  value={fees}
                  onChange={(e) => setFees(e.target.value)}
                  placeholder="0.00"
                  style={{ ...inputStyle, paddingLeft: '42px' }}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <AnimatePresence>
            {quantity && pricePerShare && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  background: 'var(--color-background-secondary)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  padding: '18px',
                  overflow: 'hidden',
                }}
              >
                <h4 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Order Summary
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1 }}>{t('assets.subtotal')}</span>
                    <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>${totalCost.toFixed(2)}</span>
                  </div>
                  {totalFees > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', flex: 1 }}>{t('assets.fees')}</span>
                      <span style={{ fontSize: '13px', color: 'var(--color-text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>${totalFees.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '10px', marginTop: '2px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>{t('assets.total')}</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-primary-light)', fontVariantNumeric: 'tabular-nums' }}>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={isSubmitting}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              padding: '14px 24px',
              background: isSubmitting ? 'var(--color-text-muted)' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: isSubmitting ? 'none' : '0 4px 16px rgba(99, 102, 241, 0.3)',
              transition: 'all 0.2s ease',
              marginTop: '4px',
            }}
          >
            <Check style={{ width: '18px', height: '18px' }} />
            <span>{isSubmitting ? t('assets.registering') : t('assets.registerPurchase')}</span>
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--color-background-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: '10px',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  fontFamily: 'var(--font-sans)',
  outline: 'none',
  transition: 'all 0.2s ease',
  fontVariantNumeric: 'tabular-nums',
};

const errorStyle: React.CSSProperties = {
  marginTop: '6px',
  fontSize: '12px',
  color: 'var(--color-danger)',
  fontWeight: 500,
};
