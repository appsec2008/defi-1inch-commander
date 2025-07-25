import type { Asset, Token } from "@/lib/types";

const API_BASE = "https://api.1inch.dev";
const CHAIN_ID = "1"; // Ethereum Mainnet

async function fetch1inch(path: string) {
  const apiKey = process.env.ONE_INCH_API_KEY;
  if (!apiKey || apiKey === 'YOUR_1INCH_API_KEY_HERE') {
    console.error("1inch API key is not set. Please add it to your .env file.");
    return { error: "API key not configured." };
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "accept": "application/json",
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ description: response.statusText }));
      console.error(`1inch API error: ${errorBody.description}`, { status: response.status, body: errorBody });
      return { error: errorBody.description || response.statusText };
    }

    return response.json();
  } catch (error: any) {
    console.error("Failed to fetch from 1inch API:", error);
    return { error: error.message || "Failed to fetch" };
  }
}

export async function getPortfolioAssets(address: string): Promise<{ assets: Asset[], raw: any, error?: string }> {
  const data = await fetch1inch(`/portfolio/v2/portfolio/${address}?chains=${CHAIN_ID}`);
  
  if (!data || data.error) {
    return { assets: [], raw: data, error: data?.error };
  }

  const ethPortfolio = data.result?.find((p: any) => p.chain_id === parseInt(CHAIN_ID));

  if (!ethPortfolio || !ethPortfolio.positions) {
    return { assets: [], raw: data };
  }

  const assets: Asset[] = ethPortfolio.positions.map((asset: any) => ({
    id: asset.token.address,
    name: asset.token.name,
    symbol: asset.token.symbol,
    icon: asset.token.logo,
    balance: asset.balance,
    price: asset.token.price,
    change24h: asset.token.price_24h_change_percent || 0,
  }));

  return { assets, raw: data };
}

export async function getTokens(): Promise<{ tokens: Token[], raw: any, error?: string }> {
    const data = await fetch1inch(`/token/v1.2/${CHAIN_ID}`);
  
    if (!data || data.error) {
      return { tokens: [], raw: data, error: data?.error };
    }
  
    const tokenList: Token[] = Object.values(data).slice(0, 100).map((token: any) => ({
      symbol: token.symbol,
      name: token.name,
      icon: token.logoURI
    }));

    return { tokens: tokenList, raw: data };
}
