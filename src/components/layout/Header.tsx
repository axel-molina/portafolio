'use client';

import { Plus, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { PortfolioSelector } from './PortfolioSelector';
import { LanguageSelector } from './LanguageSelector';

type Page = 'dashboard' | 'add' | 'detail';

interface HeaderProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  activePortfolioId: string | null;
  onSelectPortfolio: (id: string) => void;
}

export function Header({ currentPage, onNavigate, activePortfolioId, onSelectPortfolio }: HeaderProps) {
  const { t } = useTranslation();

  const pageTitles: Record<Page, string> = {
    dashboard: t('dashboard.title'),
    add: t('assets.addAsset'),
    detail: t('assets.title'),
  };

  const pageSubtitles: Record<Page, string> = {
    dashboard: t('dashboard.performance'),
    add: t('assets.selectAsset'),
    detail: t('assets.currentValue'),
  };
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(10, 10, 15, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--color-border)',
      padding: '20px 32px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {(currentPage === 'detail') && (
            <motion.button
              onClick={() => onNavigate('dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px',
                borderRadius: '10px',
                background: 'var(--color-background-card)',
                border: '1px solid var(--color-border)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
              }}
            >
              <ArrowLeft style={{ width: '18px', height: '18px', color: 'var(--color-text-secondary)' }} />
            </motion.button>
          )}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
              {pageTitles[currentPage]}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
              {pageSubtitles[currentPage]}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSelector />
          
          {currentPage === 'dashboard' && (
            <PortfolioSelector
              onSelectPortfolio={onSelectPortfolio}
              activePortfolioId={activePortfolioId}
            />
          )}

          {currentPage === 'dashboard' && (
            <motion.button
              onClick={() => onNavigate('add')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Plus style={{ width: '16px', height: '16px' }} />
              <span>{t('assets.addAsset')}</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
