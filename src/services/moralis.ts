
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
