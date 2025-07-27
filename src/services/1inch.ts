
'use server';

import type { Quote, Token, Swap, Asset, FusionQuote } from "@/lib/types";

const API_BASE = "https://api.1inch.dev";
const CHAIN_ID = "1"; // Ethereum Mainnet

type ApiResult = {
    request: { method: string, url: string, body?: any };
    response: any;
    error?: string;
}

async function fetch1inch(path: string, options: RequestInit = {}): Promise<ApiResult> {
  const apiKey = process.env.NEXT_PUBLIC_ONE_INCH_API_KEY;
  const url = `${API_BASE}${path}`;
  const method = options.method || 'GET';

  const requestDetails: ApiResult['request'] = { method, url };
  if (options.body && typeof options.body === 'string') {
    try {
        requestDetails.body = JSON.parse(options.body);
    } catch (e) {
        requestDetails.body = options.body;
    }
  }

  if (!apiKey || apiKey === 'YOUR_1INCH_API_KEY_HERE') {
    const errorMsg = "1inch API key is not set. Please add it to your .env file.";
    console.error(errorMsg);
    return { request: requestDetails, response: { error: "API key not configured." }, error: errorMsg };
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "accept": "application/json",
        ...options.headers,
      },
      cache: 'no-store'
    });

    const responseBody = await response.json().catch(() => ({ description: response.statusText, error: response.statusText }));

    if (!response.ok) {
      console.error(`1inch API error: ${responseBody.description || responseBody.error}`, { status: response.status, body: responseBody });
      return { request: requestDetails, response: responseBody, error: responseBody.description || responseBody.error };
    }

    return { request: requestDetails, response: responseBody };
  } catch (error: any) {
    console.error("Failed to fetch from 1inch API:", error);
    return { request: requestDetails, response: { error: error.message }, error: error.message || "Failed to fetch" };
  }
}

export async function getTokens(): Promise<{ tokens: Token[], raw: ApiResult, error?: string }> {
    const result = await fetch1inch(`/swap/v6.0/${CHAIN_ID}/tokens`);
  
    if (!result.response || result.error) {
      return { tokens: [], raw: result, error: result.error };
    }
  
    const tokenList: Token[] = Object.values(result.response.tokens || {}).map((token: any) => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      icon: token.logoURI
    }));

    return { tokens: tokenList, raw: result };
}

export async function getQuote(fromTokenAddress: string, toTokenAddress: string, amount: string, walletAddress: string): Promise<{ quote: FusionQuote | null, raw: ApiResult, error?: string }> {
    const params = new URLSearchParams({
        srcChain: CHAIN_ID,
        dstChain: CHAIN_ID,
        srcTokenAddress: fromTokenAddress,
        dstTokenAddress: toTokenAddress,
        amount: amount,
        walletAddress: walletAddress,
        enableEstimate: 'true',
    });

    const path = `/fusion-plus/quoter/v1.0/quote/receive?${params.toString()}`;
    const result = await fetch1inch(path, { method: 'POST' });
    
    if (!result.response || result.error) {
        return { quote: null, raw: result, error: result.error || result.response?.description };
    }
    
    return { quote: result.response, raw: result };
}

export async function getSwap(fromTokenAddress: string, toTokenAddress: string, amount: string, fromAddress: string, fromTokenSymbol?: string): Promise<{ swap: Swap | null, raw: ApiResult, error?: string }> {
    const path = `/swap/v6.0/${CHAIN_ID}/swap?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}&from=${fromAddress}&slippage=1`;
    const result = await fetch1inch(path);

    if (result.response?.description?.includes('insufficient funds')) {
        const errorMsg = `Not enough ${fromTokenSymbol || fromTokenAddress} balance.`;
        return { swap: null, raw: result, error: errorMsg };
    }

    if (!result.response || result.error) {
        return { swap: null, raw: result, error: result.error || result.response?.description };
    }

    return { swap: { ...result.response, tx: result.response.tx }, raw: result };
}

export async function getSpotPrices(tokenAddresses: string[]): Promise<{ prices: {[key: string]: number}, raw: ApiResult, error?: string }> {
    const path = `/price/v1.1/${CHAIN_ID}`;
    const result = await fetch1inch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokens: tokenAddresses, currency: 'USD' })
    });
  
    if (!result.response || result.error) {
      return { prices: {}, raw: result, error: result.error || 'Failed to fetch spot prices.' };
    }
  
    const prices: {[key: string]: number} = {};
    for (const address in result.response) {
        prices[address.toLowerCase()] = parseFloat(result.response[address]);
    }
  
    return { prices, raw: result };
}

export async function getPortfolio(address: string): Promise<{ assets: Asset[], raw: any, error?: string }> {
    const balanceResult = await fetch1inch(`/balance/v1.2/${CHAIN_ID}/balances/${address}`);
    
    const rawResponses = { balance: balanceResult, tokens: {}, spotPrices: {} };

    if (!balanceResult.response || balanceResult.error) {
        return { assets: [], raw: rawResponses, error: balanceResult.error || "Failed to fetch balances" };
    }

    const balances: { [key: string]: string } = balanceResult.response;
    const tokenAddresses = Object.keys(balances);

    if (tokenAddresses.length === 0) {
        return { assets: [], raw: rawResponses };
    }
    
    const { tokens, raw: tokensRaw } = await getTokens();
    rawResponses.tokens = tokensRaw;
    const tokenMap = new Map<string, Token>(tokens.map(t => [t.address.toLowerCase(), t]));

    const { prices, raw: pricesRaw } = await getSpotPrices(tokenAddresses);
    rawResponses.spotPrices = pricesRaw;
    
    const assets: Asset[] = tokenAddresses.map(tokenAddress => {
        const tokenInfo = tokenMap.get(tokenAddress.toLowerCase());
        const balance = parseFloat(balances[tokenAddress]) / (10 ** (tokenInfo?.decimals || 18));
        const price = prices[tokenAddress.toLowerCase()] || 0;
        
        return {
            id: tokenAddress,
            name: tokenInfo?.name || 'Unknown Token',
            symbol: tokenInfo?.symbol || 'UNKNOWN',
            icon: tokenInfo?.icon || '',
            balance,
            price,
            change24h: 0, 
        };
    }).filter(asset => asset.balance * asset.price > 0.01) // Filter out dust
      .sort((a, b) => (b.balance * b.price) - (a.balance * a.price));

    return { assets, raw: rawResponses };
}


export async function getHistory(address: string) {
    return fetch1inch(`/history/v2.0/history/${address}/events`);
}

export async function getLiquiditySources() {
    return fetch1inch(`/swap/v6.0/${CHAIN_ID}/liquidity-sources`);
}

export async function getPresets() {
    return fetch1inch(`/swap/v6.0/${CHAIN_ID}/presets`);
}

export async function getHealthCheck() {
    return fetch1inch(`/healthcheck`);
}
