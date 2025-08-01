

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


// Classic Swap Quote
export type SwapQuote = {
    dstAmount: string;
    gas: number;
}


// 1inch Fusion Types
export type FusionPreset = {
    auctionDuration: number;
    auctionStartAmount: string;
    auctionEndAmount: string;
    startAmount: string;
    points: [number, number][];
    bankFee: string;
    initialRateBump: number;
    allowPartialFills: boolean;
    allowMultipleFills: boolean;
    gasCost?: {
        gasBumpEstimate: number;
        gasPriceEstimate: string;
    }
};

export type FusionQuote = {
    quoteId: string;
    fromTokenAmount: string;
    toTokenAmount: string;
    presets: {
        fast: FusionPreset;
        medium: FusionPreset;
        slow: FusionPreset;
    };
};
