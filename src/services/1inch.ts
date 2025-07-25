
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
      "accept": "application/json",
    },
    cache: 'no-store' // Ensure fresh data on every request
  });

  if (!response.ok) {
    console.error(`1inch API error: ${response.statusText}`);
    return null;
  }

  return response.json();
}

export async function getPortfolioAssets(): Promise<Asset[]> {
    const data = await fetch1inch(`/portfolio/v3/portfolio/${CHAIN_ID}/wallets/${DEFAULT_WALLET_ADDRESS}`);
    
    if (!data || !data.length) {
        return [];
    }

    // The API returns an array of portfolio info for different chains, we find the one for our CHAIN_ID
    const ethPortfolio = data.find((p: any) => p.chain_id === CHAIN_ID);

    if (!ethPortfolio || !ethPortfolio.tokens) {
        return [];
    }
    
    const assets: Asset[] = ethPortfolio.tokens.map((asset: any) => ({
        id: asset.token.address,
        name: asset.token.name,
        symbol: asset.token.symbol,
        icon: asset.token.logo, 
        balance: asset.balance, // Balance seems to be pre-calculated
        price: asset.token.price,
        change24h: asset.token.price_24h_change_percent || 0,
    }));

    return assets;
}


export async function getTokens(): Promise<Token[]> {
    const data = await fetch1inch(`/token/v1.2/${CHAIN_ID}`);
    
    if (!data) {
        return [];
    }

    // The token list can be very large, let's take a reasonable slice for the UI
    const tokenList: Token[] = Object.values(data).slice(0, 100).map((token: any) => ({
        symbol: token.symbol,
        name: token.name,
        icon: token.logoURI,
    }));
    
    return tokenList;
}
