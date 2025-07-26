
'use server';

import type { Asset } from "@/lib/types";
import { getSpotPrices } from "./1inch";

const API_BASE = "https://deep-index.moralis.io/api/v2.2";
const CHAIN_ID = "eth";
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'; // Wrapped ETH address for price lookups

type ApiResult = {
    request: { method: string, url: string };
    response: any;
    error?: string;
}

async function fetchMoralis(path: string, options: RequestInit = {}): Promise<ApiResult> {
  const apiKey = process.env.MORALIS_API_KEY;
  const url = `${API_BASE}${path}`;
  const method = options.method || 'GET';

  const requestDetails = { method, url };

  if (!apiKey || apiKey === 'YOUR_MORALIS_API_KEY_HERE') {
    const errorMsg = "Moralis API key is not set. Please add it to your .env file.";
    console.error(errorMsg);
    return { request: requestDetails, response: { error: "API key not configured." }, error: errorMsg };
  }

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

    const responseBody = await response.json().catch(() => ({ message: response.statusText }));

    if (!response.ok) {
      console.error(`Moralis API error: ${responseBody.message}`, { status: response.status, body: responseBody });
      return { request: requestDetails, response: responseBody, error: responseBody.message || response.statusText };
    }

    return { request: requestDetails, response: responseBody };
  } catch (error: any) {
    console.error("Failed to fetch from Moralis API:", error);
    return { request: requestDetails, response: { error: error.message }, error: error.message || "Failed to fetch" };
  }
}

export async function getPortfolioAssets(address: string): Promise<{ assets: Asset[], raw: any, error?: string }> {
  // Fetch both native balance and ERC20 balances in parallel
  const [nativeBalanceResult, erc20BalancesResult] = await Promise.all([
    fetchMoralis(`/${address}/balance?chain=${CHAIN_ID}`),
    fetchMoralis(`/${address}/erc20?chain=${CHAIN_ID}`)
  ]);

  const rawResponses = {
    portfolio: { nativeBalance: nativeBalanceResult, erc20Balances: erc20BalancesResult },
    spotPrices: {}
  };
  
  const nativeBalanceData = nativeBalanceResult.response;
  const erc20BalancesData = erc20BalancesResult.response;

  if ((!nativeBalanceData || nativeBalanceResult.error) && (!erc20BalancesData || erc20BalancesResult.error)) {
    return { assets: [], raw: rawResponses, error: nativeBalanceResult.error || erc20BalancesResult.error };
  }

  const assets: Asset[] = [];
  const tokenAddressesToPrice: string[] = [];

  // Collect ERC20 token addresses
  if (erc20BalancesData && !erc20BalancesResult.error && Array.isArray(erc20BalancesData)) {
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
  if (nativeBalanceData && !nativeBalanceResult.error) {
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
  if (erc20BalancesData && !erc20BalancesResult.error && Array.isArray(erc20BalancesData)) {
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
