'use server';

import type { Asset } from "@/lib/types";
import { getTokenPrices as getDiaTokenPrices } from './dia';

const API_BASE = "https://deep-index.moralis.io/api/v2.2";
const CHAIN_ID = "eth";

async function fetchMoralis(path: string, params?: URLSearchParams) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_MORALIS_API_KEY_HERE') {
    console.error("Moralis API key is not set. Please add it to your .env file.");
    return { error: "API key not configured." };
  }

  const url = `${API_BASE}${path}${params ? `?${params.toString()}` : ''}`;

  try {
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "X-API-Key": apiKey,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      console.error(`Moralis API error: ${errorBody.message}`, { status: response.status, body: errorBody });
      return { error: errorBody.message || response.statusText };
    }

    return response.json();
  } catch (error: any) {
    console.error("Failed to fetch from Moralis API:", error);
    return { error: error.message || "Failed to fetch" };
  }
}

export async function getPortfolioAssets(address: string): Promise<{ assets: Asset[], raw: any, error?: string }> {
  const balancesData = await fetchMoralis(`/${address}/erc20`, new URLSearchParams({ chain: CHAIN_ID }));

  if (!balancesData || balancesData.error || !Array.isArray(balancesData)) {
    return { assets: [], raw: { balances: balancesData }, error: balancesData?.error };
  }

  if (balancesData.length === 0) {
      return { assets: [], raw: { balances: [] } };
  }

  const tokenAddresses = balancesData.map((token: any) => token.token_address);
  const priceMap = await getDiaTokenPrices(tokenAddresses);

  const assets: Asset[] = balancesData.map((asset: any) => {
    const balance = Number(asset.balance) / (10 ** Number(asset.decimals));
    const price = priceMap[asset.token_address] || 0;

    return {
        id: asset.token_address,
        name: asset.name,
        symbol: asset.symbol,
        icon: asset.logo || '', // Moralis may provide a logo
        balance: balance,
        price: price,
        change24h: 0, // 24h change not available from this combination of APIs
    }
  });

  return { assets, raw: { balances: balancesData, prices: priceMap } };
}
