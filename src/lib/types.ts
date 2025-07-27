
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
    dstAmount: string;
    route: { name: string }[][];
}

export type SwapTransaction = {
    from: string;
    to: string;
    data: string;
    value: string;
    gas: number;
    gasPrice: string;
}

export type Swap = Quote & {
    tx: SwapTransaction;
}
