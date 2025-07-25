"use client";

import { Header } from "@/components/dashboard/header";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { RiskAssessment } from "@/components/dashboard/risk-assessment";
import { TokenSwap } from "@/components/dashboard/token-swap";
import { getPortfolioAction, getTokensAction } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import type { Asset, Token } from "@/lib/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [portfolioAssets, setPortfolioAssets] = useState<Asset[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiResponses, setApiResponses] = useState({ portfolio: {}, tokens: {} });

  const is1inchApiConfigured = process.env.NEXT_PUBLIC_ONE_INCH_API_KEY && process.env.NEXT_PUBLIC_ONE_INCH_API_KEY !== 'YOUR_1INCH_API_KEY_HERE';
  const isMoralisApiConfigured = !!process.env.MORALIS_API_KEY && process.env.MORALIS_API_KEY !== 'YOUR_MORALIS_API_KEY_HERE';


  useEffect(() => {
    async function fetchData() {
      if (isConnected && address && is1inchApiConfigured && isMoralisApiConfigured) {
        setLoading(true);
        const [portfolioResult, tokensResult] = await Promise.all([
          getPortfolioAction(address),
          getTokensAction(),
        ]);
        
        if (portfolioResult.assets) {
            setPortfolioAssets(portfolioResult.assets);
        }
        if (tokensResult.tokens) {
            setTokens(tokensResult.tokens);
        }
        
        setApiResponses({ portfolio: portfolioResult.raw || {}, tokens: tokensResult.raw || {} });
        setLoading(false);
      } else {
        setLoading(false);
        setPortfolioAssets([]);
        setTokens([]);
        setApiResponses({ portfolio: {}, tokens: {} });
      }
    }
    fetchData();
  }, [isConnected, address, is1inchApiConfigured, isMoralisApiConfigured]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        {!isConnected && (
           <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to DeFi Commander</CardTitle>
              <CardDescription>Connect your wallet to get started.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
               <Wallet className="w-16 h-16 text-primary mb-4" />
               <h3 className="text-lg font-semibold mb-2">Please Connect Your Wallet</h3>
               <p className="text-muted-foreground mb-4 max-w-md">
                 To view your portfolio, analyze risks, and swap tokens, you need to connect a crypto wallet.
               </p>
             </CardContent>
           </Card>
        )}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!isMoralisApiConfigured && isConnected && (
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Moralis API Key Not Configured</AlertTitle>
                <AlertDescription>
                  Please add your Moralis API key to the <code>.env</code> file to see live portfolio data. Displaying empty data.
                </AlertDescription>
              </Alert>
            )}
            <PortfolioOverview assets={portfolioAssets} loading={loading} isApiConfigured={isMoralisApiConfigured} />
            <RiskAssessment portfolio={portfolioAssets} disabled={!isConnected || loading || !isMoralisApiConfigured} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TokenSwap tokens={tokens} disabled={!isConnected || loading || !is1inchApiConfigured} />
          </div>
        </div>
        {isConnected && isMoralisApiConfigured && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Portfolio API Response</CardTitle>
                        <CardDescription>Raw JSON data from the Moralis portfolio endpoint.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] w-full bg-secondary/50 rounded-md p-4">
                            <pre className="text-xs text-muted-foreground">
                                {JSON.stringify(apiResponses.portfolio, null, 2)}
                            </pre>
                        </ScrollArea>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Tokens API Response</CardTitle>
                        <CardDescription>Raw JSON data from the 1inch tokens endpoint.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[400px] w-full bg-secondary/50 rounded-md p-4">
                            <pre className="text-xs text-muted-foreground">
                                {JSON.stringify(apiResponses.tokens, null, 2)}
                            </pre>
                             <p className="text-xs text-center text-muted-foreground mt-2">(Showing first 100 tokens)</p>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        )}
      </main>
    </div>
  );
}
