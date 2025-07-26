
export type Asset = {
  id: string | number;
  name: string;
  symbol: string;
  icon: string; // URL to the icon
  balance: number;
  price: number;
  change24h: number;
};

export type Token = {
  symbol: string;
  name:string;
  address: string;
  decimals: number;
  icon: string; // URL to the icon
};

export type Quote = {
    toAmount: string;
    gas: string;
    route: { name: string }[][];
}
