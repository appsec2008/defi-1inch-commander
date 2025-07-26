
'use server';

import type { Asset } from "@/lib/types";
import { getSpotPrices } from "./1inch";

const API_BASE = "https://deep-index.moralis.io/api/v2.2";
const CHAIN_ID = "eth";
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // Wrapped ETH address for price lookups

async function fetchMoralis(path: string, options: RequestInit = {}) {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey || apiKey === 'YOUR_MORALIS_API_KEY_HERE') {
    console.error("Moralis API key is not set. Please add it to your .env file.");
    return { error: "API key not configured." };
  }

  const url = `${API_BASE}${path}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "accept": "application/json",
        "X-API-Key": apiKey,
        ...options.headers,
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
  // Fetch both native balance and ERC20 balances in parallel
  const [nativeBalanceData, erc20BalancesData] = await Promise.all([
    fetchMoralis(`/${address}/balance?chain=${CHAIN_ID}`),
    fetchMoralis(`/${address}/erc20?chain=${CHAIN_ID}`)
  ]);

  const rawResponses = {
    portfolio: { nativeBalance: nativeBalanceData || {}, erc20Balances: erc20BalancesData || {} },
    spotPrices: {}
  };

  if ((!nativeBalanceData || nativeBalanceData.error) && (!erc20BalancesData || erc20BalancesData.error)) {
    return { assets: [], raw: rawResponses, error: nativeBalanceData?.error || erc20BalancesData?.error };
  }

  const assets: Asset[] = [];
  const tokenAddressesToPrice: string[] = [];

  // Collect ERC20 token addresses
  if (erc20BalancesData && !erc20BalancesData.error && Array.isArray(erc20BalancesData)) {
    erc20BalancesData.forEach((token: any) => {
      if (token.token_address) {
        tokenAddressesToPrice.push(token.token_address);
      }
    });
  }
  
  // Add WETH to get native ETH price
  tokenAddressesToPrice.push(WETH_ADDRESS);
  
  const { prices: priceMap, raw: rawPrices } = await getSpotPrices(tokenAddressesToPrice);
  rawResponses.spotPrices = rawPrices;


  const ethPrice = priceMap[WETH_ADDRESS.toLowerCase()] || 0;

  // Process native ETH balance
  if (nativeBalanceData && !nativeBalanceData.error) {
    const ethBalance = Number(nativeBalanceData.balance) / (10 ** 18);
    if (ethBalance > 0) {
        assets.push({
            id: 'eth-native',
            name: 'Ethereum',
            symbol: 'ETH',
            icon: 'https://cdn.moralis.io/eth/0x.png',
            balance: ethBalance,
            price: ethPrice,
            change24h: 0, // 1inch spot price doesn't include 24h change
        });
    }
  }

  // Process ERC20 tokens with their prices
  if (erc20BalancesData && !erc20BalancesData.error && Array.isArray(erc20BalancesData)) {
    assets.push(...erc20BalancesData.map((asset: any) => {
        const balance = Number(asset.balance) / (10 ** Number(asset.decimals));
        const price = priceMap[asset.token_address.toLowerCase()] || 0;

        return {
            id: asset.token_address,
            name: asset.name,
            symbol: asset.symbol,
            icon: asset.logo || '',
            balance: balance,
            price: price,
            change24h: 0, // 1inch spot price doesn't include 24h change
        };
    }));
  }

  // Filter out assets with zero value unless they are the only asset
  const valuableAssets = assets.filter(asset => asset.balance * asset.price > 0.01);

  return { assets: valuableAssets.length > 0 ? valuableAssets : assets, raw: rawResponses };
}
