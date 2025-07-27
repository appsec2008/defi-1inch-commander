
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
    nativeBalance: nativeBalanceResult,
    erc20Balances: erc20BalancesResult,
    spotPrices: {}
  };
  
  const nativeBalanceData = nativeBalanceResult.response;
  const erc20BalancesData = erc20BalancesResult.response;

  if ((!nativeBalanceData || nativeBalanceResult.error) && (!erc20BalancesData || erc20BalancesResult.error)) {
    return { assets: [], raw: rawResponses, error: nativeBalanceResult.error || erc20BalancesResult.error };
  }

  let assets: Asset[] = [];

  // Process native ETH balance first to get ETH price
  const { prices: ethPriceResult, raw: ethPriceRaw } = await getSpotPrices([WETH_ADDRESS]);
  rawResponses.spotPrices = ethPriceRaw; // Store the raw response for ETH price
  const ethPrice = ethPriceResult[WETH_ADDRESS.toLowerCase()] || 0;

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
            change24h: 0,
        });
    }
  }

  // Now process ERC20 tokens
  if (erc20BalancesData && !erc20BalancesResult.error && Array.isArray(erc20BalancesData)) {
    // Create a preliminary list of ERC20 assets without prices
    const erc20Assets = erc20BalancesData.map((token: any) => {
      const balance = Number(token.balance) / (10 ** Number(token.decimals));
      return {
          id: token.token_address,
          name: token.name,
          symbol: token.symbol,
          icon: token.logo || '',
          balance: balance,
          price: 0, // Placeholder
          change24h: 0,
      };
    });

    // Heuristically sort to find most likely valuable assets to price
    const sortedErc20Assets = erc20Assets.sort((a, b) => {
        // Prioritize common stablecoins and WETH first
        if (['USDT', 'USDC', 'DAI', 'WETH'].includes(a.symbol.toUpperCase())) return -1;
        if (['USDT', 'USDC', 'DAI', 'WETH'].includes(b.symbol.toUpperCase())) return 1;
        // Then sort by balance as a rough proxy for value
        return b.balance - a.balance;
    });

    // Get prices for a manageable subset (e.g., top 50) of tokens
    const tokensToPrice = sortedErc20Assets.slice(0, 50).map(a => a.id as string);
    
    let priceMap: { [key: string]: number } = {};
    if (tokensToPrice.length > 0) {
      const { prices: erc20Prices, raw: erc20PricesRaw } = await getSpotPrices(tokensToPrice);
      priceMap = erc20Prices;
       // Combine raw price responses for UI transparency
       rawResponses.spotPrices = { 
        request: {
            method: 'GET',
            url: `${ethPriceRaw.request.url},${erc20PricesRaw.request.url.split('?')[1]}`
        },
        response: { ...ethPriceRaw.response, ...erc20PricesRaw.response }
      };
    }

    // Update ERC20 assets with fetched prices and add them to the main assets list
    const pricedErc20Assets = erc20Assets.map(asset => ({
        ...asset,
        price: priceMap[asset.id.toLowerCase()] || 0,
    }));
    
    assets.push(...pricedErc20Assets);
  }

  // Filter out assets with zero or negligible value
  const valuableAssets = assets.filter(asset => (asset.balance * asset.price) > 0.01);

  return { assets: valuableAssets, raw: rawResponses };
}
