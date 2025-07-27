'use server';

import type { Quote, Token } from "@/lib/types";

const API_BASE = "https://api.1inch.dev";
const CHAIN_ID = "1"; // Ethereum Mainnet

type ApiResult = {
    request: { method: string, url: string };
    response: any;
    error?: string;
}

async function fetch1inch(path: string, options: RequestInit = {}): Promise<ApiResult> {
  const apiKey = process.env.NEXT_PUBLIC_ONE_INCH_API_KEY;
  const url = `${API_BASE}${path}`;
  const method = options.method || 'GET';

  const requestDetails = { method, url };

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
    const result = await fetch1inch(`/token/v1.2/${CHAIN_ID}`);
  
    if (!result.response || result.error) {
      return { tokens: [], raw: result, error: result.error };
    }
  
    const tokenList: Token[] = Object.values(result.response).slice(0, 100).map((token: any) => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      icon: token.logoURI
    }));

    return { tokens: tokenList, raw: result };
}

export async function getQuote(fromTokenAddress: string, toTokenAddress: string, amount: string): Promise<{ quote: Quote | null, raw: ApiResult, error?: string }> {
    const path = `/swap/v6.0/${CHAIN_ID}/quote?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}`;
    const result = await fetch1inch(path);
    
    if (!result.response || result.error) {
        return { quote: null, raw: result, error: result.error || result.response?.description };
    }
    
    const quote: Quote = {
        dstAmount: result.response.dstAmount,
        gas: result.response.gas,
        route: result.response.route,
    };
    
    return { quote, raw: result };
}

export async function getSpotPrices(tokenAddresses: string[]): Promise<{ prices: {[key: string]: number}, raw: ApiResult, error?: string }> {
    const addressesString = tokenAddresses.join(',');
    const path = `/price/v1.1/${CHAIN_ID}?tokens=${addressesString}&currency=USD`;
    
    const result = await fetch1inch(path, {
        method: 'GET',
    });
  
    if (!result.response || result.error) {
      return { prices: {}, raw: result, error: result.error || 'Failed to fetch spot prices.' };
    }
  
    // The response is an object with token addresses as keys and their USD prices as values.
    const prices: {[key: string]: number} = {};
    for (const address in result.response) {
        prices[address.toLowerCase()] = parseFloat(result.response[address]);
    }
  
    return { prices, raw: result };
}


export async function getPortfolio(address: string) {
    return fetch1inch(`/portfolio/v1.0/1/wallets/${address}`);
}

export async function getHistory(address: string) {
    return fetch1inch(`/history/v2.0/history/${address}/events`);
}

export async function getLiquiditySources() {
    return fetch1inch(`/token/v1.2/${CHAIN_ID}/liquidity-sources`);
}

export async function getPresets() {
    return fetch1inch(`/token/v1.2/${CHAIN_ID}/presets`);
}

export async function getHealthCheck() {
    return fetch1inch(`/healthcheck/v1.2/`);
}
