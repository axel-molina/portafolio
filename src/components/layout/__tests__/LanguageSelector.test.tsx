import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LanguageSelector } from '../LanguageSelector';

// Mock i18n - must use module factory
jest.mock('@/i18n/client', () => ({
  changeLanguage: jest.fn(),
}));

import { changeLanguage } from '@/i18n/client';

describe('LanguageSelector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders with default language (Spanish)', () => {
    render(<LanguageSelector />);
    
    expect(screen.getByText('🇪🇸 ES')).toBeInTheDocument();
  });

  it('opens dropdown when button is clicked', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /🇪🇸 es/i });
    fireEvent.click(button);
    
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('loads language from localStorage on mount', () => {
    localStorage.setItem('i18nextLng', 'en');
    
    render(<LanguageSelector />);
    
    expect(screen.getByText('🇺🇸 EN')).toBeInTheDocument();
  });

  it('displays both language options in dropdown', () => {
    render(<LanguageSelector />);
    
    const button = screen.getByRole('button', { name: /🇪🇸 es/i });
    fireEvent.click(button);
    
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('has globe icon', () => {
    render(<LanguageSelector />);
    
    const globeIcon = document.querySelector('svg');
    expect(globeIcon).toBeInTheDocument();
  });
});