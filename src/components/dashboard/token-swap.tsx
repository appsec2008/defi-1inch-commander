
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Token, Asset, SwapQuote } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import { ArrowDown, Loader2, Repeat, Terminal } from "lucide-react";
import Image from "next/image";
import { getQuoteAction } from "@/app/actions";
import { useDebounce } from "@/hooks/use-debounce";
import { useAccount } from "wagmi";


interface TokenSwapProps {
  tokens: Token[];
  portfolio: Asset[];
  disabled: boolean;
  onQuoteResponse: (response: any) => void;
  onGasResponse: (response: any) => void;
}

type SwapSuccessDetails = {
    quote: SwapQuote;
    fromToken: Token;
    toToken: Token;
    fromAmount: string;
    txHash: string;
}

export function TokenSwap({ tokens = [], portfolio = [], disabled, onQuoteResponse, onGasResponse }: TokenSwapProps) {
  const { address, isConnected } = useAccount();
  const [fromTokenSymbol, setFromTokenSymbol] = useState<string | undefined>();
  const [toTokenSymbol, setToTokenSymbol] = useState<string | undefined>();
  const [fromAmount, setFromAmount] = useState<string>("1.0");
  
  const [quote, setQuote] = useState<SwapQuote | null>(null);

  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [isSwapSuccessDialogOpen, setIsSwapSuccessDialogOpen] = useState(false);
  const [swapSuccessDetails, setSwapSuccessDetails] = useState<SwapSuccessDetails | null>(null);

  const debouncedFromAmount = useDebounce(fromAmount, 500);

  const fromTokenData = useMemo(() => tokens.find(t => t.symbol === fromTokenSymbol), [tokens, fromTokenSymbol]);
  const toTokenData = useMemo(() => tokens.find(t => t.symbol === toTokenSymbol), [tokens, toTokenSymbol]);
  
  const portfolioTokens = useMemo(() => {
    const swappableSymbols = new Set(tokens.map(t => t.symbol));
    const portfolioAssets = portfolio.filter(p => swappableSymbols.has(p.symbol) && p.balance > 0);
    
    return portfolioAssets.map(asset => {
        const tokenInfo = tokens.find(t => t.symbol === asset.symbol);
        return {
            ...asset,
            address: tokenInfo?.address || '',
            decimals: tokenInfo?.decimals || 18,
            value: asset.balance * asset.price,
        };
    }).sort((a,b) => b.value - a.value);

  }, [tokens, portfolio]);


  const is1inchApiConfigured = !!process.env.NEXT_PUBLIC_ONE_INCH_API_KEY && process.env.NEXT_PUBLIC_ONE_INCH_API_KEY !== 'YOUR_1INCH_API_KEY_HERE';

  useEffect(() => {
    if (portfolioTokens.length > 0) {
        const defaultFromAsset = portfolioTokens[0];
        if (defaultFromAsset?.symbol) {
             setFromTokenSymbol(defaultFromAsset.symbol);
        }

        let defaultToSymbol: string | undefined;
        const usdt = tokens.find(t => t.symbol === 'USDT');
        const usdc = tokens.find(t => t.symbol === 'USDC');
        
        if (defaultFromAsset?.symbol === 'USDT' && usdc) {
            defaultToSymbol = 'USDC';
        } else if (usdt && defaultFromAsset?.symbol !== 'USDT') {
            defaultToSymbol = 'USDT';
        } else if (tokens.find(t => t.symbol !== defaultFromAsset.symbol)) {
            defaultToSymbol = tokens.find(t => t.symbol !== defaultFromAsset.symbol)?.symbol;
        }
        
        setToTokenSymbol(defaultToSymbol);
    } else if (tokens.length > 0) {
        setFromTokenSymbol('ETH');
        const usdtToken = tokens.find(t => t.symbol === 'USDT');
        if (usdtToken) {
          setToTokenSymbol('USDT');
        } else if (tokens.length > 1) {
          setToTokenSymbol(tokens[1].symbol)
        }
    }
}, [tokens, portfolioTokens]);


  const fetchQuote = useCallback(async () => {
    if (!fromTokenData || !toTokenData || !debouncedFromAmount || isNaN(parseFloat(debouncedFromAmount)) || disabled || parseFloat(debouncedFromAmount) <= 0) {
      setQuote(null);
      onQuoteResponse({});
      return;
    }

    setIsFetchingQuote(true);
    setQuoteError(null);

    try {
        const quoteResult = await getQuoteAction(
            { address: fromTokenData.address, decimals: fromTokenData.decimals }, 
            { address: toTokenData.address, decimals: toTokenData.decimals }, 
            debouncedFromAmount,
        );
        
        onQuoteResponse(quoteResult.raw || { error: quoteResult.error });
        if (quoteResult.error) {
            setQuoteError(quoteResult.error);
            setQuote(null);
        } else if (quoteResult.data) {
            setQuote(quoteResult.data);
        }

    } catch (e) {
      const errorMessage = "Failed to fetch quote.";
      setQuoteError(errorMessage);
      setQuote(null);
      const rawError = { request: { from: fromTokenData, to: toTokenData, amount: debouncedFromAmount }, response: { error: errorMessage }};
      onQuoteResponse(rawError);
    } finally {
      setIsFetchingQuote(false);
    }
  }, [fromTokenData, toTokenData, debouncedFromAmount, disabled, onQuoteResponse]);


  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleFromTokenChange = (symbol: string | undefined) => {
    if (!symbol) return;
    setFromTokenSymbol(symbol);
  };

  const handleToTokenChange = (symbol: string | undefined) => {
    if (!symbol) return;
    setToTokenSymbol(symbol);
  }

  const handleSwapTokens = () => {
    const tempFromSymbol = fromTokenSymbol;
    setFromTokenSymbol(toTokenSymbol);
    setToTokenSymbol(tempFromSymbol);
  };

  const handleExecuteSwap = async () => {
    if (!fromTokenData || !toTokenData || !fromAmount || !address || !quote) return;
    
    setIsSwapping(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSwapping(false);

    // This is a simulation, we generate a fake hash and show the success dialog.
    const simulatedTxHash = `0x${[...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setSwapSuccessDetails({
        quote: quote,
        fromToken: fromTokenData,
        toToken: toTokenData,
        fromAmount,
        txHash: simulatedTxHash,
    });
    setIsSwapSuccessDialogOpen(true);
  };

  const toAmountDisplay = isFetchingQuote ? "..." : (quote?.toAmount ? parseFloat(quote.toAmount).toFixed(5) : "0.0");
  const isFetching = isFetchingQuote;

  return (
    <>
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Token Swap</CardTitle>
        <CardDescription>
          Get the best rates via 1inch.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
        {isConnected && !is1inchApiConfigured && (
           <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>1inch API Not Configured</AlertTitle>
            <AlertDescription>
              Add your 1inch API key to the <code>.env</code> file to enable token swapping.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2 relative">
          <Label htmlFor="from-token">From</Label>
          <div className="flex gap-2">
            <Select value={fromTokenSymbol} onValueChange={handleFromTokenChange} disabled={disabled || portfolioTokens.length === 0}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {fromTokenData?.icon && <Image src={fromTokenData.icon} alt={fromTokenData.name} width={20} height={20} />}
                    <span>{fromTokenData?.symbol || 'Select'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {portfolioTokens.length > 0 ? portfolioTokens.map((token) => (
                  <SelectItem key={token.address} value={token.symbol} disabled={token.symbol === toTokenSymbol}>
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                            {token.icon && <Image src={token.icon} alt={token.name} width={20} height={20} />}
                            <span>{token.symbol}</span>
                        </div>
                        <span className="text-muted-foreground text-xs font-mono">{token.balance.toFixed(4)}</span>
                    </div>
                  </SelectItem>
                )) : <SelectItem value="no-tokens" disabled>No portfolio tokens found</SelectItem>}
              </SelectContent>
            </Select>
            <Input
              id="from-token"
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              disabled={disabled}
            />
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Button variant="ghost" size="icon" onClick={handleSwapTokens} disabled={disabled}>
              <Repeat className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex justify-center -my-3 z-10 relative">
          <ArrowDown className="w-6 h-6 text-muted-foreground bg-card p-1 rounded-full border" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="to-token">To (estimated)</Label>
          <div className="flex gap-2">
            <Select value={toTokenSymbol} onValueChange={handleToTokenChange} disabled={disabled}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                    <div className="flex items-center gap-2">
                      {toTokenData?.icon && <Image src={toTokenData.icon} alt={toTokenData.name} width={20} height={20} />}
                      <span>{toTokenData?.symbol || 'Select'}</span>
                    </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                    <SelectItem key={token.address} value={token.symbol} disabled={token.symbol === fromTokenSymbol}>
                       <div className="flex items-center gap-2">
                        {token.icon && <Image src={token.icon} alt={token.name} width={20} height={20} />}
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input id="to-token" type="number" placeholder="0.0" value={toAmountDisplay} readOnly disabled={disabled}/>
          </div>
        </div>
        
        {(quoteError) && <Alert variant="destructive"><AlertDescription>{quoteError}</AlertDescription></Alert>}
      </CardContent>
      <CardFooter className="mt-auto">
        <Button
          size="lg"
          className="w-full font-bold"
          onClick={handleExecuteSwap}
          disabled={isSwapping || isFetching || !quote || !fromAmount || disabled}
        >
          {isSwapping ? <><Loader2 className="animate-spin mr-2" />Swapping...</> : isFetching ? <><Loader2 className="mr-2 animate-spin" />Fetching Quote...</> : "Swap (Simulated)"}
        </Button>
      </CardFooter>
    </Card>

    {swapSuccessDetails && (
        <AlertDialog open={isSwapSuccessDialogOpen} onOpenChange={setIsSwapSuccessDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Swap Successful (Simulated)</AlertDialogTitle>
                <AlertDialogDescription>
                    Your simulated swap was executed. Here are the details.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="text-sm space-y-4">
                    <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-md">
                        <span className="text-muted-foreground">From</span>
                        <span className="font-bold text-lg">{swapSuccessDetails.fromAmount} {swapSuccessDetails.fromToken.symbol}</span>
                    </div>
                    <div className="flex justify-center -my-3 z-10 relative">
                        <ArrowDown className="w-6 h-6 text-muted-foreground bg-background p-1 rounded-full border" />
                    </div>
                    <div className="flex justify-between items-center bg-secondary/50 p-3 rounded-md">
                        <span className="text-muted-foreground">To (est.)</span>
                        <span className="font-bold text-lg text-accent">{parseFloat(swapSuccessDetails.quote.toAmount).toFixed(5)} {swapSuccessDetails.toToken.symbol}</span>
                    </div>
                    <div className="space-y-2 text-xs border-t pt-4">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Transaction Hash:</span>
                            <span className="font-mono truncate max-w-[180px]">{swapSuccessDetails.txHash}</span>
                        </div>
                    </div>
                </div>
                <AlertDialogFooter>
                <AlertDialogAction onClick={() => setIsSwapSuccessDialogOpen(false)}>Close</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </>
  );
}

const Label = (props: React.ComponentProps<"label">) => (
  <label {...props} className="text-sm font-medium text-muted-foreground" />
);

    
