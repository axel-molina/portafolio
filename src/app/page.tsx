'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { PortfolioDashboard } from '@/components/dashboard/PortfolioDashboard';
import { AddAssetForm } from '@/components/forms/AddAssetForm';
import { AssetDetail } from '@/components/asset/AssetDetail';
import { usePortfolioStore } from '@/store/portfolioStore';
import { signUp, signIn, signInWithOAuth, getCurrentUser } from '@/lib/insforge';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Loader2, Mail, Github } from 'lucide-react';

type Page = 'dashboard' | 'add' | 'detail';

export default function Home() {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedAssetTicker, setSelectedAssetTicker] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const activePortfolioId = usePortfolioStore((state) => state.activePortfolioId);
  const portfolios = usePortfolioStore((state) => state.portfolios);
  const loading = usePortfolioStore((state) => state.loading);
  const loadPortfolios = usePortfolioStore((state) => state.loadPortfolios);
  const setActivePortfolio = usePortfolioStore((state) => state.setActivePortfolio);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user?.user?.id) {
          setIsAuthenticated(true);
          await loadPortfolios();
        }
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, [loadPortfolios]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
      setIsAuthenticated(true);
      await loadPortfolios();
    } catch (err) {
      setAuthError((err as Error).message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const { url } = await signInWithOAuth(provider, window.location.origin);
    if (url) window.location.href = url;
  };

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
    if (page !== 'detail') {
      setSelectedAssetTicker(null);
    }
  };

  const handleSelectAsset = (ticker: string) => {
    setSelectedAssetTicker(ticker);
    setCurrentPage('detail');
  };

  const handleSelectPortfolio = (id: string) => {
    setActivePortfolio(id);
  };

  // Auth Screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
        padding: '24px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            width: '100%',
            maxWidth: '400px',
            background: 'var(--color-background-card)',
            borderRadius: '20px',
            border: '1px solid var(--color-border)',
            padding: '40px',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)',
            }}>
              <TrendingUp style={{ width: '32px', height: '32px', color: '#fff' }} />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.5px' }}>
              {t('auth.welcomeBack')}
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginTop: '4px' }}>
              {t('portfolio.createFirst')}
            </p>
          </div>

          {/* OAuth Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
            <motion.button
              onClick={() => handleOAuth('google')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 010-9.18l-7.98-6.19a24.01 24.01 0 000 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              {t('auth.continueWithGoogle')}
            </motion.button>
            <motion.button
              onClick={() => handleOAuth('github')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '12px',
                background: 'var(--color-background-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                color: 'var(--color-text-primary)',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <Github style={{ width: '18px', height: '18px' }} />
              {t('auth.continueWithGitHub')}
            </motion.button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--color-background-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'var(--color-background-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '10px',
                  color: 'var(--color-text-primary)',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {authError && (
              <p style={{ fontSize: '13px', color: 'var(--color-danger)', fontWeight: 500, margin: 0 }}>
                {authError}
              </p>
            )}

            <motion.button
              type="submit"
              disabled={authLoading}
              whileHover={{ scale: authLoading ? 1 : 1.02 }}
              whileTap={{ scale: authLoading ? 1 : 0.98 }}
              style={{
                width: '100%',
                padding: '12px',
                background: authLoading ? 'var(--color-text-muted)' : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: authLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '4px',
              }}
            >
              {authLoading ? (
                <>
                  <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                  {isSignUp ? t('auth.registerError') : t('auth.loginError')}
                </>
              ) : (
                <>{isSignUp ? t('auth.createAccount') : t('auth.signIn')}</>
              )}
            </motion.button>

            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary-light)',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              {isSignUp ? t('auth.hasAccount') : t('auth.noAccount')}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-background)',
      }}>
        <Loader2 style={{ width: '32px', height: '32px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  // Main App
  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--color-background)', fontFamily: 'var(--font-sans)' }}>
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          activePortfolioId={activePortfolioId}
          onSelectPortfolio={handleSelectPortfolio}
        />

        <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>
          {!activePortfolioId && portfolios.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ textAlign: 'center', padding: '60px 24px' }}
            >
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'var(--color-background-hover)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <TrendingUp style={{ width: '36px', height: '36px', color: 'var(--color-text-muted)' }} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                Welcome to Portfolio Tracker
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', maxWidth: '400px', margin: '0 auto' }}>
                Create your first portfolio to start tracking your investments
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              {currentPage === 'dashboard' && activePortfolioId && (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <PortfolioDashboard onSelectAsset={handleSelectAsset} />
                </motion.div>
              )}

              {currentPage === 'add' && activePortfolioId && (
                <motion.div
                  key="add"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <AddAssetForm
                    portfolioId={activePortfolioId}
                    onSuccess={() => handleNavigate('dashboard')}
                  />
                </motion.div>
              )}

              {currentPage === 'detail' && selectedAssetTicker && (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <AssetDetail
                    ticker={selectedAssetTicker}
                    onBack={() => handleNavigate('dashboard')}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
