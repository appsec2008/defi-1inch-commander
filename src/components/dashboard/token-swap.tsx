"use client";

import { useState, useEffect, useMemo } from "react";
import type { Token } from "@/lib/types";
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
import { ArrowDown, ChevronsRight, Repeat } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface TokenSwapProps {
  tokens: Token[];
}

export function TokenSwap({ tokens = [] }: TokenSwapProps) {
  const [fromToken, setFromToken] = useState<string | undefined>(tokens[0]?.symbol);
  const [toToken, setToToken] = useState<string | undefined>(tokens[2]?.symbol);
  const [fromAmount, setFromAmount] = useState<string>("1.0");
  const [toAmount, setToAmount] = useState<string>("");
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const { toast } = useToast();

  const fromTokenData = useMemo(() => tokens.find(t => t.symbol === fromToken), [tokens, fromToken]);
  const toTokenData = useMemo(() => tokens.find(t => t.symbol === toToken), [tokens, toToken]);

  useEffect(() => {
    // Reset selections if tokens list changes and selected tokens are not available
    if (tokens.length > 0) {
      if (!fromToken || !tokens.find(t => t.symbol === fromToken)) {
        setFromToken(tokens[0]?.symbol);
      }
      if (!toToken || !tokens.find(t => t.symbol === toToken)) {
        setToToken(tokens.find(t => t.symbol !== fromToken) || tokens[1]?.symbol);
      }
    }
  }, [tokens, fromToken, toToken]);

  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount)) && fromTokenData && toTokenData) {
      // In a real app, this is where you'd call the 1inch API for a quote
      // For now, we'll simulate a quote based on some made up price relationship
      const simulatedPrice = (fromTokenData.symbol.length / toTokenData.symbol.length) * 1.337;
      const calculatedToAmount = parseFloat(fromAmount) * simulatedPrice;
      setToAmount(calculatedToAmount.toFixed(5));
    } else {
      setToAmount("");
    }
  }, [fromAmount, fromTokenData, toTokenData]);

  const handleSwap = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
  };

  const handleExecuteSwap = () => {
    setIsSwapping(true);
    // Simulate API call for swap
    setTimeout(() => {
      setIsSwapping(false);
      toast({
        title: "Swap Successful!",
        description: `Swapped ${fromAmount} ${fromToken} for ${toAmount} ${toToken}.`,
        variant: "default",
      });
    }, 2000);
  };

  if (tokens.length === 0) {
    return (
       <Card>
        <CardHeader>
            <CardTitle className="font-headline">Token Swap</CardTitle>
            <CardDescription>
            Find the best rates for your token swaps.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-10">
                Token list is unavailable. Please configure the API key.
            </div>
        </CardContent>
       </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Token Swap</CardTitle>
        <CardDescription>
          Find the best rates for your token swaps.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2 relative">
          <Label htmlFor="from-token">From</Label>
          <div className="flex gap-2">
            <Select value={fromToken} onValueChange={setFromToken}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {fromTokenData?.icon && <Image src={fromTokenData.icon} alt={fromTokenData.name} width={20} height={20} />}
                    <span>{fromToken}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                  <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === toToken}>
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
            />
          </div>

          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <Button variant="ghost" size="icon" onClick={handleSwap}>
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
            <Select value={toToken} onValueChange={setToToken}>
              <SelectTrigger className="w-[150px]">
                <SelectValue>
                    <div className="flex items-center gap-2">
                      {toTokenData?.icon && <Image src={toTokenData.icon} alt={toTokenData.name} width={20} height={20} />}
                      <span>{toToken}</span>
                    </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol} disabled={token.symbol === fromToken}>
                       <div className="flex items-center gap-2">
                        {token.icon && <Image src={token.icon} alt={token.name} width={20} height={20} />}
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Input id="to-token" type="number" placeholder="0.0" value={toAmount} readOnly />
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium">Optimal Route (Simulated)</h4>
          <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-secondary/50">
            <div className="flex items-center gap-2 font-mono flex-wrap">
              <span>{fromToken}</span>
              <ChevronsRight className="w-4 h-4 text-muted-foreground" />
              <span>WETH</span>
              <ChevronsRight className="w-4 h-4 text-muted-foreground" />
              <span>1INCH</span>
              <ChevronsRight className="w-4 h-4 text-muted-foreground" />
              <span>{toToken}</span>
            </div>
            <span className="text-accent font-semibold">100%</span>
          </div>
           <div className="text-xs text-muted-foreground space-y-1">
             <div className="flex justify-between">
                <span>Price:</span>
                <span className="font-mono">1 {fromToken} = {toAmount ? (parseFloat(toAmount)/parseFloat(fromAmount)).toFixed(4) : '...'} {toToken}</span>
             </div>
             <div className="flex justify-between">
                <span>Gas Fee:</span>
                <span className="font-mono">~$5.42 (Simulated)</span>
             </div>
           </div>
        </div>


        <Button
          size="lg"
          className="w-full font-bold"
          onClick={handleExecuteSwap}
          disabled={isSwapping || !fromAmount || !toAmount}
        >
          {isSwapping ? "Swapping..." : "Swap"}
        </Button>
      </CardContent>
    </Card>
  );
}

const Label = (props: React.ComponentProps<"label">) => (
  <label {...props} className="text-sm font-medium text-muted-foreground" />
);
