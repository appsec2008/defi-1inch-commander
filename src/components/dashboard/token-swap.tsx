"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import type { Token, Quote } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { ArrowDown, ChevronsRight, Loader2, Repeat, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getQuoteAction } from "@/app/actions";
import { useDebounce } from "@/hooks/use-debounce";

interface TokenSwapProps {
  tokens: Token[];
  disabled: boolean;
}

export function TokenSwap({ tokens = [], disabled }: TokenSwapProps) {
  const [fromTokenSymbol, setFromTokenSymbol] = useState<string | undefined>();
  const [toTokenSymbol, setToTokenSymbol] = useState<string | undefined>();
  const [fromAmount, setFromAmount] = useState<string>("1.0");
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isFetchingQuote, setIsFetchingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const { toast } = useToast();

  const debouncedFromAmount = useDebounce(fromAmount, 500);

  const fromTokenData = useMemo(() => tokens.find(t => t.symbol === fromTokenSymbol), [tokens, fromTokenSymbol]);
  const toTokenData = useMemo(() => tokens.find(t => t.symbol === toTokenSymbol), [tokens, toTokenSymbol]);

  useEffect(() => {
    if (tokens.length > 0) {
        if (!fromTokenSymbol || !tokens.find(t => t.symbol === fromTokenSymbol)) {
            setFromTokenSymbol(tokens.find(t => t.symbol === 'ETH')?.symbol || tokens[0]?.symbol);
        }
        if (!toTokenSymbol || !tokens.find(t => t.symbol === toTokenSymbol) || toTokenSymbol === fromTokenSymbol) {
            setToTokenSymbol(tokens.find(t => t.symbol === 'USDC' && t.symbol !== fromTokenSymbol)?.symbol || tokens.find(t => t.symbol !== fromTokenSymbol)?.symbol);
        }
    }
  }, [tokens, fromTokenSymbol, toTokenSymbol]);

  const fetchQuote = useCallback(async () => {
    if (!fromTokenData || !toTokenData || !debouncedFromAmount || isNaN(parseFloat(debouncedFromAmount)) || disabled) {
      setQuote(null);
      return;
    }

    setIsFetchingQuote(true);
    setQuoteError(null);
    try {
      const result = await getQuoteAction(fromTokenData, toTokenData, debouncedFromAmount);
      if (result.error) {
        setQuoteError(result.error);
        setQuote(null);
      } else {
        setQuote(result.data);
      }
    } catch (e) {
      setQuoteError("Failed to fetch quote.");
      setQuote(null);
    } finally {
      setIsFetchingQuote(false);
    }
  }, [fromTokenData, toTokenData, debouncedFromAmount, disabled]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSwapTokens = () => {
    const temp = fromTokenSymbol;
    setFromTokenSymbol(toTokenSymbol);
    setToTokenSymbol(temp);
  };

  const handleExecuteSwap = () => {
    setIsSwapping(true);
    // Simulate API call for swap
    setTimeout(() => {
      setIsSwapping(false);
      toast({
        title: "Swap Successful! (Simulated)",
        description: `Swapped ${fromAmount} ${fromTokenSymbol} for ${quote?.toAmount} ${toTokenSymbol}.`,
      });
    }, 2000);
  };

  const toAmountDisplay = isFetchingQuote ? "..." : (quote?.toAmount ? parseFloat(quote.toAmount).toFixed(5) : "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Token Swap</CardTitle>
        <CardDescription>
          Find the best rates for your token swaps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {disabled && (
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
            <Select value={fromTokenSymbol} onValueChange={setFromTokenSymbol} disabled={disabled}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {fromTokenData?.icon && <Image src={fromTokenData.icon} alt={fromTokenData.name} width={20} height={20} />}
                    <span>{fromTokenData?.symbol || 'Select'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.address} value={token.symbol} disabled={token.symbol === toTokenSymbol}>
                    <div className="flex items-center gap-2">
                      {token.icon && <Image src={token.icon} alt={token.name} width={20} height={20} />}
                      <span>{token.symbol}</span>
                    </div>
                  </SelectItem>
                ))}
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
          <Label htmlFor="to-token">To</Label>
          <div className="flex gap-2">
            <Select value={toTokenSymbol} onValueChange={setToTokenSymbol} disabled={disabled}>
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

        {quoteError && <Alert variant="destructive"><AlertDescription>{quoteError}</AlertDescription></Alert>}

        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium">Optimal Route</h4>
          <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/50 min-h-[44px]">
             {disabled ? <span className="text-muted-foreground">Connect wallet & configure API</span> : 
              isFetchingQuote ? <Loader2 className="w-4 h-4 animate-spin" /> : 
              quote?.route ? (
                <div className="flex items-center gap-1.5 font-mono flex-wrap text-xs">
                  <span>{fromTokenSymbol}</span>
                  {quote.route.map((hop, hopIndex) => (
                      <div key={hopIndex} className="flex items-center gap-1.5">
                          <ChevronsRight className="w-4 h-4 text-muted-foreground" />
                          <div className="flex items-center gap-1">
                            {hop.map((part, partIndex) => (
                                <span key={partIndex}>{part.name}</span>
                            ))}
                          </div>
                      </div>
                  ))}
                </div>
            ) : <span className="text-muted-foreground text-xs">Enter an amount to see route</span>}
            {!disabled && !isFetchingQuote && quote && <span className="text-accent font-semibold">100%</span>}
          </div>
           <div className="text-xs text-muted-foreground space-y-1">
             <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-mono">
                    {isFetchingQuote ? '...' : quote && fromAmount ? `1 ${fromTokenSymbol} = ${(parseFloat(toAmountDisplay)/parseFloat(fromAmount)).toFixed(4)} ${toTokenSymbol}` : 'N/A'}
                </span>
             </div>
             <div className="flex justify-between">
                <span>Gas Fee (est.):</span>
                <span className="font-mono">{isFetchingQuote ? '...' : quote?.gas ? `~${quote.gas} units` : 'N/A'}</span>
             </div>
           </div>
        </div>


        <Button
          size="lg"
          className="w-full font-bold"
          onClick={handleExecuteSwap}
          disabled={isSwapping || isFetchingQuote || !quote || !fromAmount || disabled}
        >
          {isSwapping ? <Loader2 className="animate-spin" /> : isFetchingQuote ? <><Loader2 className="mr-2 animate-spin" />Fetching Quote...</> : "Swap (Simulated)"}
        </Button>
      </CardContent>
    </Card>
  );
}

const Label = (props: React.ComponentProps<"label">) => (
  <label {...props} className="text-sm font-medium text-muted-foreground" />
);
