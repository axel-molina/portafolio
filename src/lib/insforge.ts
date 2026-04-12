import { createClient } from '@insforge/sdk';
import type {
  DbPortfolio,
  DbPortfolioAsset,
  DbPurchase,
} from '@/lib/types';

const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});

// ─── Portfolios ──────────────────────────────────────────

export async function getPortfolios(): Promise<DbPortfolio[]> {
  const { data, error } = await insforge.database
    .from('portfolios')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as DbPortfolio[];
}

export async function createPortfolio(
  name: string,
  description?: string
): Promise<DbPortfolio> {
  const { data: userData } = await insforge.auth.getCurrentUser();
  if (!userData?.user?.id) throw new Error('User not authenticated');

  const { data, error } = await insforge.database
    .from('portfolios')
    .insert([{
      user_id: userData.user.id,
      name,
      description: description || null,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as DbPortfolio;
}

export async function updatePortfolio(
  id: string,
  updates: { name?: string; description?: string }
): Promise<DbPortfolio> {
  const { data, error } = await insforge.database
    .from('portfolios')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DbPortfolio;
}

export async function deletePortfolio(id: string): Promise<void> {
  const { error } = await insforge.database
    .from('portfolios')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// ─── Portfolio Assets ────────────────────────────────────

export async function getPortfolioAssets(
  portfolioId: string
): Promise<DbPortfolioAsset[]> {
  const { data, error } = await insforge.database
    .from('portfolio_assets')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []) as DbPortfolioAsset[];
}

export async function createOrUpdateAsset(
  portfolioId: string,
  ticker: string,
  name: string,
  assetType: string,
  quantity: number,
  pricePerShare: number,
  fees: number
): Promise<DbPortfolioAsset> {
  // Check if asset already exists in this portfolio
  const { data: existing } = await insforge.database
    .from('portfolio_assets')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('ticker', ticker)
    .single();

  const totalInvested = (quantity * pricePerShare) + fees;

  if (existing) {
    // Update existing asset
    const dbAsset = existing as DbPortfolioAsset;
    const newTotalQuantity = dbAsset.total_quantity + quantity;
    const newTotalInvested = dbAsset.total_invested + totalInvested;
    const newAveragePrice = newTotalQuantity > 0
      ? newTotalInvested / newTotalQuantity
      : 0;

    const { data, error } = await insforge.database
      .from('portfolio_assets')
      .update({
        total_quantity: newTotalQuantity,
        average_price: newAveragePrice,
        total_invested: newTotalInvested,
      })
      .eq('id', dbAsset.id)
      .select()
      .single();

    if (error) throw error;
    return data as DbPortfolioAsset;
  } else {
    // Create new asset
    const { data, error } = await insforge.database
      .from('portfolio_assets')
      .insert([{
        portfolio_id: portfolioId,
        ticker,
        name,
        asset_type: assetType,
        total_quantity: quantity,
        average_price: pricePerShare,
        total_invested: totalInvested,
      }])
      .select()
      .single();

    if (error) throw error;
    return data as DbPortfolioAsset;
  }
}

export async function deleteAssetFromPortfolio(assetId: string): Promise<void> {
  const { error } = await insforge.database
    .from('portfolio_assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
}

// ─── Purchases ───────────────────────────────────────────

export async function getAssetPurchases(
  portfolioId: string,
  assetId: string
): Promise<DbPurchase[]> {
  const { data, error } = await insforge.database
    .from('purchases')
    .select('*')
    .eq('portfolio_id', portfolioId)
    .eq('asset_id', assetId)
    .order('date', { ascending: false });

  if (error) throw error;
  return (data || []) as DbPurchase[];
}

export async function createPurchase(
  portfolioId: string,
  assetId: string,
  ticker: string,
  quantity: number,
  pricePerShare: number,
  date: string,
  fees: number
): Promise<DbPurchase> {
  const { data, error } = await insforge.database
    .from('purchases')
    .insert([{
      portfolio_id: portfolioId,
      asset_id: assetId,
      ticker,
      quantity,
      price_per_share: pricePerShare,
      date,
      fees,
    }])
    .select()
    .single();

  if (error) throw error;
  return data as DbPurchase;
}

export async function deletePurchase(purchaseId: string): Promise<void> {
  const { error } = await insforge.database
    .from('purchases')
    .delete()
    .eq('id', purchaseId);

  if (error) throw error;
}

// ─── Auth helpers ────────────────────────────────────────

export async function signIn(email: string, password: string) {
  const { data, error } = await insforge.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await insforge.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithOAuth(provider: 'google' | 'github', redirectTo: string) {
  const { data, error } = await insforge.auth.signInWithOAuth({
    provider,
    redirectTo,
  });
  if (error) throw error;
  return data;
}

export async function getCurrentUser() {
  const { data, error } = await insforge.auth.getCurrentUser();
  if (error) throw error;
  return data;
}

export async function signOut() {
  await insforge.auth.signOut();
}

// Re-export for direct use
export { insforge };
