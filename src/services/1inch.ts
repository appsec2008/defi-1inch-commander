
import type { Asset, Token } from "@/lib/types";

const API_BASE = "https://api.1inch.dev";

// A default address to showcase the functionality
const DEFAULT_WALLET_ADDRESS = "0xde0b295669a9fd93d5f28d9ec85e40f4cb697bae"; 
const CHAIN_ID = "1"; // Ethereum Mainnet

async function fetch1inch(path: string) {
  const apiKey = process.env.ONE_INCH_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    console.error("1inch API key is not set. Please add it to your .env file.");
    // Return empty/default data to avoid crashing the app
    return null;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    console.error(`1inch API error: ${response.statusText}`);
    return null;
  }

  return response.json();
}

export async function getPortfolioAssets(): Promise<Asset[]> {
    const data = await fetch1inch(`/portfolio/v4/portfolio/${CHAIN_ID}/${DEFAULT_WALLET_ADDRESS}/tokens/`);
    
    if (!data || !data.portfolios || !data.portfolios.length) {
        return [];
    }

    const assets: Asset[] = data.portfolios[0].assets.map((asset: any) => ({
        id: asset.id,
        name: asset.name,
        symbol: asset.symbol,
        icon: asset.logo_url, // API provides a URL for the icon
        balance: asset.amount,
        price: asset.price,
        change24h: asset.price_24h_change || 0,
    }));

    return assets;
}

export async function getTokens(): Promise<Token[]> {
    const data = await fetch1inch(`/token/v1.2/${CHAIN_ID}/token-list`);
    
    if (!data || !data.tokens) {
        return [];
    }

    // The token list can be very large, let's take a reasonable slice for the UI
    const tokenList: Token[] = Object.values(data.tokens).slice(0, 50).map((token: any) => ({
        symbol: token.symbol,
        name: token.name,
        icon: token.logoURI,
    }));
    
    return tokenList;
}
