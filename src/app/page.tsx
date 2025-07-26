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
import { useEffect, useState, useCallback } from "react";
import type { Asset, Token } from "@/lib/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [portfolioAssets, setPortfolioAssets] = useState<Asset[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiTokensResponse, setApiTokensResponse] = useState({});
  const [apiSpotPriceResponse, setApiSpotPriceResponse] = useState({});
  const [apiQuoteResponse, setApiQuoteResponse] = useState({});


  // These checks are for UI feedback only. The actual API calls use server-side keys.
  const is1inchApiConfigured = !!process.env.NEXT_PUBLIC_ONE_INCH_API_KEY && process.env.NEXT_PUBLIC_ONE_INCH_API_KEY !== 'YOUR_1INCH_API_KEY_HERE';
  const isMoralisApiConfigured = process.env.NEXT_PUBLIC_MORALIS_API_KEY_IS_CONFIGURED === 'true';
  
  const handleQuoteResponse = useCallback((response: any) => {
    setApiQuoteResponse(response || {});
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (isConnected && address) {
        setLoading(true);
        const promises = [];
        
        if (isMoralisApiConfigured) {
          promises.push(getPortfolioAction(address));
        } else {
          console.log("Moralis API not configured for UI. Skipping portfolio fetch.");
          promises.push(Promise.resolve({ assets: [], raw: { portfolio: { error: 'Moralis API not configured.'}, spotPrices: { error: 'Moralis API not configured.'} } }));
        }

        if (is1inchApiConfigured) {
          promises.push(getTokensAction());
        } else {
            console.log("1inch API not configured for UI. Skipping tokens fetch.");
          promises.push(Promise.resolve({ tokens: [], raw: { error: '1inch API not configured.'}}));
        }

        const [portfolioResult, tokensResult] = await Promise.all(promises);
        
        if (portfolioResult.assets) {
            setPortfolioAssets(portfolioResult.assets);
        }
        if (tokensResult.tokens) {
            setTokens(tokensResult.tokens);
        }
        
        setApiTokensResponse(tokensResult.raw || {});
        setApiSpotPriceResponse(portfolioResult.raw?.spotPrices || {});

        setLoading(false);
      } else {
        setLoading(false);
        setPortfolioAssets([]);
        setTokens([]);
        setApiTokensResponse({});
        setApiSpotPriceResponse({});
        setApiQuoteResponse({});
      }
    }
    fetchData();
  }, [isConnected, address, is1inchApiConfigured, isMoralisApiConfigured]);

  const renderApiResponseCard = (title: string, description: string, data: any) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <h4 className="text-sm font-semibold mb-2">Request</h4>
        <pre className="text-xs text-muted-foreground bg-secondary/50 rounded-md p-2 mb-4 break-all">
          {data?.request ? `${data.request.method} ${data.request.url}` : 'N/A'}
        </pre>
        <h4 className="text-sm font-semibold mb-2">Response</h4>
        <ScrollArea className="h-[300px] w-full bg-secondary/50 rounded-md p-4">
          <pre className="text-xs text-muted-foreground">
            {JSON.stringify(data?.response || data || {}, null, 2)}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );

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
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Moralis API Key Not Configured</AlertTitle>
                <AlertDescription>
                  Please add your Moralis API key to the <code>.env</code> file to see your portfolio. This feature is currently disabled.
                </AlertDescription>
              </Alert>
            )}
            <PortfolioOverview assets={portfolioAssets} loading={loading} isMoralisApiConfigured={isMoralisApiConfigured} />
            <RiskAssessment portfolio={portfolioAssets} disabled={!isConnected || loading || !isMoralisApiConfigured} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TokenSwap 
                tokens={tokens} 
                portfolio={portfolioAssets} 
                disabled={!isConnected || loading || !is1inchApiConfigured}
                onQuoteResponse={handleQuoteResponse}
            />
          </div>
        </div>
        {isConnected && (
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {renderApiResponseCard(
                    "1inch Tokens API",
                    "Fetches a list of all swappable tokens.",
                    apiTokensResponse
                )}
                {renderApiResponseCard(
                    "1inch Spot Price API",
                    "Fetches current prices for portfolio tokens.",
                    apiSpotPriceResponse
                )}
                {renderApiResponseCard(
                    "1inch Quote API",
                    "Fetches swap quotes and gas estimates.",
                    apiQuoteResponse
                )}
            </div>
        )}
      </main>
    </div>
  );
}
