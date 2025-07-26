'use server';

import type { Quote, Token } from "@/lib/types";

const API_BASE = "https://api.1inch.dev";
const CHAIN_ID = "1"; // Ethereum Mainnet

async function fetch1inch(path: string) {
  const apiKey = process.env.NEXT_PUBLIC_ONE_INCH_API_KEY;
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

    return await response.json();
  } catch (error: any) {
    console.error("Failed to fetch from 1inch API:", error);
    return { error: error.message || "Failed to fetch" };
  }
}

export async function getTokens(): Promise<{ tokens: Token[], raw: any, error?: string }> {
    const data = await fetch1inch(`/token/v1.2/${CHAIN_ID}`);
  
    if (!data || data.error) {
      return { tokens: [], raw: data, error: data?.error };
    }
  
    const tokenList: Token[] = Object.values(data).slice(0, 100).map((token: any) => ({
      symbol: token.symbol,
      name: token.name,
      address: token.address,
      decimals: token.decimals,
      icon: token.logoURI
    }));

    return { tokens: tokenList, raw: data };
}

export async function getQuote(fromTokenAddress: string, toTokenAddress: string, amount: string): Promise<{ quote: Quote | null, raw: any, error?: string }> {
    const path = `/swap/v6.0/${CHAIN_ID}/quote?src=${fromTokenAddress}&dst=${toTokenAddress}&amount=${amount}`;
    const data = await fetch1inch(path);

    if (!data || data.error) {
        return { quote: null, raw: data, error: data?.error || data?.description };
    }
    
    const quote: Quote = {
        toAmount: data.dstAmount,
        gas: data.gas,
        route: data.route,
    };
    
    return { quote, raw: data };
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
