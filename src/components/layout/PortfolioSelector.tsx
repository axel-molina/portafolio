'use client';

import { useEffect, useState } from 'react';
import { usePortfolioStore } from '@/store/portfolioStore';
import { Portfolio } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Check, X, ChevronDown } from 'lucide-react';

interface PortfolioSelectorProps {
  onSelectPortfolio: (id: string) => void;
  activePortfolioId: string | null;
}

export function PortfolioSelector({ onSelectPortfolio, activePortfolioId }: PortfolioSelectorProps) {
  const { t } = useTranslation();
  const portfolios = usePortfolioStore((state) => state.portfolios);
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const activePortfolio = portfolios.find((p) => p.id === activePortfolioId);

  const handleCreatePortfolio = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await usePortfolioStore.getState().addPortfolio(newName.trim(), newDescription.trim() || undefined);
      setNewName('');
      setNewDescription('');
      setShowNewForm(false);
      setOpen(false);
    } catch {
      // Error handled in store
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Selector Button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          background: 'var(--color-background-card)',
          border: '1px solid var(--color-border)',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          transition: 'all 0.2s ease',
          minWidth: '180px',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
          {activePortfolio?.name || t('portfolio.select')}
        </span>
        <ChevronDown style={{ width: '14px', height: '14px', color: 'var(--color-text-muted)', flexShrink: 0 }} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              onClick={() => { setOpen(false); setShowNewForm(false); }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: 0,
                zIndex: 50,
                width: '280px',
                background: 'var(--color-background-card)',
                border: '1px solid var(--color-border)',
                borderRadius: '14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                overflow: 'hidden',
              }}
            >
              {/* Portfolio List */}
              {!showNewForm ? (
                <div style={{ padding: '8px', maxHeight: '260px', overflowY: 'auto' }}>
                  {portfolios.length === 0 ? (
                    <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '13px' }}>
                      {t('portfolio.noPortfolios')}
                    </div>
                  ) : (
                    portfolios.map((portfolio: Portfolio) => (
                      <button
                        key={portfolio.id}
                        onClick={() => {
                          onSelectPortfolio(portfolio.id);
                          setOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: portfolio.id === activePortfolioId
                            ? 'rgba(99, 102, 241, 0.12)'
                            : 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          fontWeight: portfolio.id === activePortfolioId ? 600 : 500,
                          color: portfolio.id === activePortfolioId
                            ? 'var(--color-primary-light)'
                            : 'var(--color-text-primary)',
                          transition: 'background 0.12s ease',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {portfolio.name}
                        </span>
                        {portfolio.id === activePortfolioId && (
                          <Check style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                        )}
                      </button>
                    ))
                  )}

                  {/* Add New Button */}
                  <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '4px', paddingTop: '4px' }}>
                    <button
                      onClick={() => setShowNewForm(true)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'var(--color-primary-light)',
                        transition: 'background 0.12s ease',
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(99, 102, 241, 0.08)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <Plus style={{ width: '14px', height: '14px' }} />
                      {t('portfolio.newPortfolio')}
                    </button>
                  </div>
                </div>
              ) : (
                /* New Portfolio Form */
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {t('portfolio.newPortfolio')}
                    </h4>
                    <button
                      onClick={() => setShowNewForm(false)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '2px', display: 'flex' }}
                    >
                      <X style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('portfolio.portfolioName')}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePortfolio(); }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--color-background-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      marginBottom: '8px',
                      boxSizing: 'border-box',
                    }}
                  />

                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'var(--color-background-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none',
                      fontFamily: 'var(--font-sans)',
                      boxSizing: 'border-box',
                      marginBottom: '12px',
                    }}
                  />

                  <motion.button
                    onClick={handleCreatePortfolio}
                    disabled={creating || !newName.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: creating || !newName.trim()
                        ? 'var(--color-text-muted)'
                        : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: creating || !newName.trim() ? 'not-allowed' : 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    {creating ? t('portfolio.creating') : t('portfolio.createPortfolio')}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
