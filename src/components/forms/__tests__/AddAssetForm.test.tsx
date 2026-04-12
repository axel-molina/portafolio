import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddAssetForm } from '../AddAssetForm';

// Mock dependencies
jest.mock('@/store/portfolioStore', () => ({
  usePortfolioStore: jest.fn(() => ({
    addPurchase: jest.fn(),
  })),
}));

jest.mock('@/lib/types', () => ({
  AVAILABLE_ASSETS: [
    { ticker: 'AAPL', name: 'Apple Inc.', type: 'stock' },
    { ticker: 'GOOGL', name: 'Alphabet Inc.', type: 'stock' },
    { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
    { ticker: 'CEPU', name: 'CEP Argentina', type: 'cedear' },
  ],
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { whileHover, whileTap, initial, animate, transition, ...rest } = props;
      return <div data-testid="motion-div">{children}</div>;
    },
    button: ({ children, ...props }: any) => {
      const { whileHover, whileTap, ...rest } = props;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('AddAssetForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form title', () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    expect(screen.getByText('Register New Purchase')).toBeInTheDocument();
  });

  it('shows back button', () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    expect(screen.getByText(/Back to Dashboard/)).toBeInTheDocument();
  });

  it('has asset search input', () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    expect(screen.getByPlaceholderText('assets.searchPlaceholder')).toBeInTheDocument();
  });

  it('shows fill in details text', () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    expect(screen.getByText(/Fill in the details/i)).toBeInTheDocument();
  });

  it('filters assets on search', async () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    const searchInput = screen.getByPlaceholderText('assets.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'AAPL' } });
    fireEvent.focus(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  it('shows type badge for assets', async () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    const searchInput = screen.getByPlaceholderText('assets.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: 'BTC' } });
    fireEvent.focus(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('crypto')).toBeInTheDocument();
    });
  });

  it('calls onSuccess when back button clicked', () => {
    render(<AddAssetForm onSuccess={mockOnSuccess} portfolioId="portfolio-1" />);
    
    const backButton = screen.getByText(/Back to Dashboard/);
    fireEvent.click(backButton);
    
    expect(mockOnSuccess).toHaveBeenCalled();
  });
});