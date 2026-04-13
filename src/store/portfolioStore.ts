import { create } from 'zustand';
import type { Asset, Portfolio, Purchase, AssetType, DbPortfolioAsset } from '@/lib/types';
import {
  getPortfolios,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioAssets,
  createOrUpdateAsset,
  createPurchase,
  deletePurchase as deletePurchaseDb,
  getAssetPurchases,
  deleteAssetFromPortfolio,
} from '@/lib/insforge';

interface PortfolioState {
  // Portfolios
  portfolios: Portfolio[];
  activePortfolioId: string | null;
  loading: boolean;
  error: string | null;

  // Actions - Portfolios
  loadPortfolios: () => Promise<void>;
  setActivePortfolio: (id: string | null) => void;
  addPortfolio: (name: string, description?: string) => Promise<void>;
  removePortfolio: (id: string) => Promise<void>;

  // Actions - Assets
  addPurchase: (
    portfolioId: string,
    ticker: string,
    name: string,
    type: AssetType,
    quantity: number,
    pricePerShare: number,
    date: string,
    fees?: number
  ) => Promise<void>;
  removeAsset: (assetId: string, portfolioId: string) => Promise<void>;
  removePurchase: (purchaseId: string, assetId: string, portfolioId: string) => Promise<void>;

  // Derived data
  activeAssets: Asset[];
  setAssets: (assets: Asset[]) => void;

  // Internal
  loadAssetsForPortfolio: (portfolioId: string) => Promise<void>;
}

// Map DB row to Asset type
const mapAsset = (dbAsset: DbPortfolioAsset, purchases: Purchase[]): Asset => ({
  id: dbAsset.id,
  portfolioId: dbAsset.portfolio_id,
  ticker: dbAsset.ticker,
  name: dbAsset.name,
  type: dbAsset.asset_type,
  totalQuantity: dbAsset.total_quantity,
  averagePrice: dbAsset.average_price,
  totalInvested: dbAsset.total_invested,
  purchases,
});

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  // State
  portfolios: [],
  activePortfolioId: null,
  loading: false,
  error: null,
  activeAssets: [],

  // ─── Portfolios ─────────────────────────────────────
  loadPortfolios: async () => {
    try {
      set({ loading: true, error: null });
      const dbPortfolios = await getPortfolios();
      const portfolios: Portfolio[] = dbPortfolios.map((p) => ({
        id: p.id,
        userId: p.user_id,
        name: p.name,
        description: p.description || undefined,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      }));

      set({ portfolios, loading: false });

      // If no active portfolio but portfolios exist, select first and load assets
      if (!get().activePortfolioId && portfolios.length > 0) {
        const firstId = portfolios[0].id;
        set({ activePortfolioId: firstId });
        // Load assets for the first portfolio
        await get().loadAssetsForPortfolio(firstId);
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  setActivePortfolio: (id: string | null) => {
    set({ activePortfolioId: id, activeAssets: [] });
    if (id) {
      get().loadAssetsForPortfolio(id);
    }
  },

  addPortfolio: async (name, description) => {
    try {
      const dbPortfolio = await createPortfolio(name, description);
      const portfolio: Portfolio = {
        id: dbPortfolio.id,
        userId: dbPortfolio.user_id,
        name: dbPortfolio.name,
        description: dbPortfolio.description || undefined,
        createdAt: dbPortfolio.created_at,
        updatedAt: dbPortfolio.updated_at,
      };

      set((state) => ({
        portfolios: [...state.portfolios, portfolio],
        activePortfolioId: state.activePortfolioId || portfolio.id,
      }));
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removePortfolio: async (id) => {
    try {
      await deletePortfolio(id);
      set((state) => {
        const remaining = state.portfolios.filter((p) => p.id !== id);
        return {
          portfolios: remaining,
          activePortfolioId:
            state.activePortfolioId === id
              ? remaining.length > 0
                ? remaining[0].id
                : null
              : state.activePortfolioId,
          activeAssets:
            state.activePortfolioId === id ? [] : state.activeAssets,
        };
      });
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  // ─── Assets ──────────────────────────────────────────
  addPurchase: async (portfolioId, ticker, name, type, quantity, pricePerShare, date, fees = 0) => {
    try {
      const purchaseId = crypto.randomUUID();

      // Create/update asset in DB
      const dbAsset = await createOrUpdateAsset(
        portfolioId,
        ticker,
        name,
        type,
        quantity,
        pricePerShare,
        fees
      );

      // Create purchase record
      await createPurchase(portfolioId, dbAsset.id, ticker, quantity, pricePerShare, date, fees);

      // Reload assets to reflect changes
      await get().loadAssetsForPortfolio(portfolioId);
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removeAsset: async (assetId, portfolioId) => {
    try {
      console.log('[PortfolioStore] Removing asset:', assetId, portfolioId);
      await deleteAssetFromPortfolio(assetId);
      await get().loadAssetsForPortfolio(portfolioId);
    } catch (err) {
      console.log('[PortfolioStore] Error removing asset:', err);
      set({ error: (err as Error).message });
      throw err;
    }
  },

  removePurchase: async (purchaseId, assetId, portfolioId) => {
    try {
      await deletePurchaseDb(purchaseId);
      // Recalculate asset totals
      const state = get();
      const asset = state.activeAssets.find((a) => a.id === assetId);
      if (asset) {
        const purchases = asset.purchases.filter((p) => p.id !== purchaseId);
        if (purchases.length === 0) {
          // No more purchases, remove asset
          await deleteAssetFromPortfolio(assetId);
        } else {
          const totalQuantity = purchases.reduce((sum, p) => sum + p.quantity, 0);
          const totalInvested = purchases.reduce(
            (sum, p) => sum + p.quantity * p.pricePerShare + (p.fees || 0),
            0
          );
          const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

          await createOrUpdateAsset(
            portfolioId,
            asset.ticker,
            asset.name,
            asset.type,
            // Recalculate by getting total from remaining purchases
            0, // Will be handled by reload
            0,
            0
          );
        }
      }
      await get().loadAssetsForPortfolio(portfolioId);
    } catch (err) {
      set({ error: (err as Error).message });
      throw err;
    }
  },

  // ─── Load assets for active portfolio ────────────────
  loadAssetsForPortfolio: async (portfolioId: string) => {
    try {
      const dbAssets = await getPortfolioAssets(portfolioId);
      console.log('[PortfolioStore] Loading assets for portfolio:', portfolioId, 'Count:', dbAssets.length);

      // Load purchases for each asset
      const assets: Asset[] = [];
      for (const dbAsset of dbAssets) {
        const purchases = await getAssetPurchases(portfolioId, dbAsset.id);
        console.log('[PortfolioStore] Asset:', dbAsset.ticker, 'Purchases:', purchases.length, 'assetId:', dbAsset.id);
        const mappedPurchases: Purchase[] = purchases.map((p) => ({
          id: p.id,
          portfolioId: p.portfolio_id,
          assetId: p.asset_id,
          assetTicker: p.ticker,
          quantity: p.quantity,
          pricePerShare: p.price_per_share,
          date: p.date,
          fees: p.fees || 0,
        }));

        assets.push(mapAsset(dbAsset, mappedPurchases));
      }

      set({ activeAssets: assets });
      console.log('[PortfolioStore] Total assets:', assets.length, 'Total purchases:', assets.reduce((sum, a) => sum + a.purchases.length, 0));
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  setAssets: (assets) => set({ activeAssets: assets }),
}));
