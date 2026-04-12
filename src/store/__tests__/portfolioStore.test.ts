import { usePortfolioStore } from '../portfolioStore';

// Mock the InsForge functions
jest.mock('@/lib/insforge', () => ({
  getPortfolios: jest.fn(),
  createPortfolio: jest.fn(),
  deletePortfolio: jest.fn(),
  getPortfolioAssets: jest.fn(),
  createOrUpdateAsset: jest.fn(),
  createPurchase: jest.fn(),
  deletePurchase: jest.fn(),
  getAssetPurchases: jest.fn(),
  deleteAssetFromPortfolio: jest.fn(),
}));

import {
  getPortfolios,
  createPortfolio,
  deletePortfolio,
  getPortfolioAssets,
  getAssetPurchases,
} from '@/lib/insforge';

const mockGetPortfolios = getPortfolios as jest.Mock;
const mockCreatePortfolio = createPortfolio as jest.Mock;
const mockDeletePortfolio = deletePortfolio as jest.Mock;
const mockGetPortfolioAssets = getPortfolioAssets as jest.Mock;
const mockGetAssetPurchases = getAssetPurchases as jest.Mock;

describe('usePortfolioStore', () => {
  beforeEach(() => {
    usePortfolioStore.setState({
      portfolios: [],
      activePortfolioId: null,
      loading: false,
      error: null,
      activeAssets: [],
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('has empty portfolios by default', () => {
      const state = usePortfolioStore.getState();
      expect(state.portfolios).toEqual([]);
    });

    it('has no active portfolio by default', () => {
      const state = usePortfolioStore.getState();
      expect(state.activePortfolioId).toBeNull();
    });

    it('is not loading by default', () => {
      const state = usePortfolioStore.getState();
      expect(state.loading).toBe(false);
    });

    it('has no error by default', () => {
      const state = usePortfolioStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe('loadPortfolios', () => {
    it('loads portfolios and sets first as active', async () => {
      const mockDbPortfolios = [
        { id: '1', user_id: 'user1', name: 'Portfolio 1', description: null, created_at: '2024-01-01', updated_at: '2024-01-01' },
      ];

      mockGetPortfolios.mockResolvedValue(mockDbPortfolios);

      await usePortfolioStore.getState().loadPortfolios();

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(1);
      expect(state.portfolios[0].name).toBe('Portfolio 1');
      expect(state.activePortfolioId).toBe('1');
    });

    it('handles errors', async () => {
      mockGetPortfolios.mockRejectedValue(new Error('Network error'));

      await usePortfolioStore.getState().loadPortfolios();

      const state = usePortfolioStore.getState();
      expect(state.error).toBe('Network error');
    });
  });

  describe('setActivePortfolio', () => {
    it('sets active portfolio id', async () => {
      mockGetPortfolioAssets.mockResolvedValue([]);
      mockGetAssetPurchases.mockResolvedValue([]);

      await usePortfolioStore.getState().setActivePortfolio('new-id');

      const state = usePortfolioStore.getState();
      expect(state.activePortfolioId).toBe('new-id');
    });

    it('clears active portfolio when set to null', async () => {
      usePortfolioStore.setState({ activePortfolioId: 'some-id' });

      await usePortfolioStore.getState().setActivePortfolio(null);

      const state = usePortfolioStore.getState();
      expect(state.activePortfolioId).toBeNull();
    });
  });

  describe('addPortfolio', () => {
    it('creates new portfolio', async () => {
      const mockDbPortfolio = {
        id: 'new-id',
        user_id: 'user1',
        name: 'New Portfolio',
        description: 'Test description',
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockCreatePortfolio.mockResolvedValue(mockDbPortfolio);

      await usePortfolioStore.getState().addPortfolio('New Portfolio', 'Test description');

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(1);
      expect(state.portfolios[0].name).toBe('New Portfolio');
    });

    it('sets new portfolio as active when none selected', async () => {
      const mockDbPortfolio = {
        id: 'new-id',
        user_id: 'user1',
        name: 'New Portfolio',
        description: null,
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      };

      mockCreatePortfolio.mockResolvedValue(mockDbPortfolio);

      await usePortfolioStore.getState().addPortfolio('New Portfolio');

      const state = usePortfolioStore.getState();
      expect(state.activePortfolioId).toBe('new-id');
    });

    it('handles creation error', async () => {
      mockCreatePortfolio.mockRejectedValue(new Error('Auth error'));

      await expect(
        usePortfolioStore.getState().addPortfolio('Fail Portfolio')
      ).rejects.toThrow('Auth error');
    });
  });

  describe('removePortfolio', () => {
    it('deletes portfolio and selects next one', async () => {
      usePortfolioStore.setState({
        portfolios: [
          { id: '1', name: 'Portfolio 1' } as any,
          { id: '2', name: 'Portfolio 2' } as any,
        ],
        activePortfolioId: '1',
      });

      mockDeletePortfolio.mockResolvedValue(undefined);

      await usePortfolioStore.getState().removePortfolio('1');

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(1);
      expect(state.portfolios[0].id).toBe('2');
    });

    it('clears active when last portfolio deleted', async () => {
      usePortfolioStore.setState({
        portfolios: [{ id: '1', name: 'Portfolio 1' } as any],
        activePortfolioId: '1',
      });

      mockDeletePortfolio.mockResolvedValue(undefined);

      await usePortfolioStore.getState().removePortfolio('1');

      const state = usePortfolioStore.getState();
      expect(state.portfolios).toHaveLength(0);
      expect(state.activePortfolioId).toBeNull();
    });
  });

  describe('setAssets', () => {
    it('sets active assets directly', () => {
      const assets = [
        { ticker: 'AAPL', name: 'Apple' } as any,
        { ticker: 'GOOGL', name: 'Google' } as any,
      ];

      usePortfolioStore.getState().setAssets(assets);

      const state = usePortfolioStore.getState();
      expect(state.activeAssets).toHaveLength(2);
    });
  });
});