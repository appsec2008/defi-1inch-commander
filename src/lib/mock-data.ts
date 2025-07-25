import type { Asset, Token } from "./types";
import { Bitcoin, CircleDollarSign, Diamond } from "lucide-react";
import type { LucideIcon } from "lucide-react";


export const iconMap: { [key: string]: LucideIcon } = {
  Diamond,
  Bitcoin,
  CircleDollarSign,
};

export const portfolioAssets: Asset[] = [
  { id: 'eth', name: "Ethereum", symbol: "ETH", icon: "Diamond", balance: 10.5, price: 3012.34, change24h: 2.5 },
  { id: 'btc', name: "Bitcoin", symbol: "BTC", icon: "Bitcoin", balance: 2.1, price: 61045.67, change24h: -1.2 },
  { id: 'usdc', name: "USD Coin", symbol: "USDC", icon: "CircleDollarSign", balance: 50210.88, price: 1.00, change24h: 0.01 },
  { id: 'dai', name: "Dai", symbol: "DAI", icon: "CircleDollarSign", balance: 25000.00, price: 1.00, change24h: -0.02 },
];

export const tokens: Token[] = [
  { symbol: "ETH", name: "Ethereum", icon: "Diamond" },
  { symbol: "BTC", name: "Bitcoin", icon: "Bitcoin" },
  { symbol: "USDC", name: "USD Coin", icon: "CircleDollarSign" },
  { symbol: "DAI", name: "Dai", icon: "CircleDollarSign" },
  { symbol: "USDT", name: "Tether", icon: "CircleDollarSign" },
  { symbol: "WBTC", name: "Wrapped Bitcoin", icon: "Bitcoin" },
];
