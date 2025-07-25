
export type Asset = {
  id: string;
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
  icon: string; // URL to the icon
};
