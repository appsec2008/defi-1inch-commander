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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


export default function Home() {
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const [addressSource, setAddressSource] = useState<'wallet' | 'hardcoded'>('hardcoded');
  
  const [portfolioAssets, setPortfolioAssets] = useState<Asset[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiTokensResponse, setApiTokensResponse] = useState({});
  const [apiQuoteResponse, setApiQuoteResponse] = useState({});
  const [apiGasResponse, setApiGasResponse] = useState({});
  const [apiSpotPricesResponse, setApiSpotPricesResponse] = useState({});
  const [apiRiskAnalysisResponse, setApiRiskAnalysisResponse] = useState({});
  
  // States for individual 1inch API calls for AI context
  const [apiAiHistoryResponse, setApiAiHistoryResponse] = useState({});
  const [apiAiTokensResponse, setApiAiTokensResponse] = useState({});
  const [apiAiLiquidityResponse, setApiAiLiquidityResponse] = useState({});
  const [apiAiPresetsResponse, setApiAiPresetsResponse] = useState({});
  const [apiAiHealthResponse, setApiAiHealthResponse] = useState({});


  const testAddress = '0x5555555555555555555555555555555555555555';
  const isConnected = addressSource === 'hardcoded' || isWalletConnected;
  const address = addressSource === 'hardcoded' ? testAddress : walletAddress;

  // These checks are for UI feedback only. The actual API calls use server-side keys.
  const is1inchApiConfigured = !!process.env.NEXT_PUBLIC_ONE_INCH_API_KEY && process.env.NEXT_PUBLIC_ONE_INCH_API_KEY !== 'YOUR_1INCH_API_KEY_HERE';
  const isMoralisApiConfigured = true; // Moralis is no longer used for portfolio, so we can set this to true
  
  const handleQuoteResponse = useCallback((response: any) => {
    setApiQuoteResponse(response || {});
  }, []);

  const handleGasResponse = useCallback((response: any) => {
    setApiGasResponse(response || {});
  }, []);

  const handleAnalysisResponse = useCallback((response: any) => {
    setApiRiskAnalysisResponse(response?.ai || {});
    setApiAiHistoryResponse(response?.raw?.history || {});
    setApiAiTokensResponse(response?.raw?.tokens || {});
    setApiAiLiquidityResponse(response?.raw?.liquiditySources || {});
    setApiAiPresetsResponse(response?.raw?.presets || {});
    setApiAiHealthResponse(response?.raw?.health || {});
  }, []);

  useEffect(() => {
    async function fetchData() {
      if (isConnected && address) {
        setLoading(true);
        const promises = [];
        
        if (is1inchApiConfigured) {
          promises.push(getPortfolioAction(address));
          promises.push(getTokensAction());
        } else {
          console.log("1inch API not configured for UI. Skipping fetches.");
          promises.push(Promise.resolve({ assets: [], raw: { error: '1inch API not configured.' } }));
          promises.push(Promise.resolve({ tokens: [], raw: { error: '1inch API not configured.'}}));
        }

        const [portfolioResult, tokensResult] = await Promise.all(promises);
        
        if (portfolioResult.assets) {
            setPortfolioAssets(portfolioResult.assets);
        }
        if (portfolioResult.raw?.spotPrices) {
            setApiSpotPricesResponse(portfolioResult.raw.spotPrices);
        }

        if (tokensResult.tokens) {
            setTokens(tokensResult.tokens);
        }
        
        setApiTokensResponse(tokensResult.raw || {});

        setLoading(false);
      } else {
        setLoading(false);
        setPortfolioAssets([]);
        setTokens([]);
        setApiTokensResponse({});
        setApiQuoteResponse({});
        setApiGasResponse({});
        setApiSpotPricesResponse({});
        setApiRiskAnalysisResponse({});
        setApiAiHistoryResponse({});
        setApiAiTokensResponse({});
        setApiAiLiquidityResponse({});
        setApiAiPresetsResponse({});
        setApiAiHealthResponse({});
      }
    }
    fetchData();
  }, [isConnected, address, is1inchApiConfigured]);

  const renderApiResponseCard = (title: string, description: string, data: any) => {
    const isAiCard = title === "AI Risk Assessment";
    let requestData = data?.request;
    let responseData = data?.response || data || {};

    return (
        <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            <h4 className="text-sm font-semibold mb-2">Request</h4>
            <ScrollArea className="h-[200px] w-full bg-secondary/50 rounded-md p-4 mb-4">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(requestData, null, 2)}
                </pre>
            </ScrollArea>

            <h4 className="text-sm font-semibold mb-2">Response</h4>
            <ScrollArea className="h-[300px] w-full bg-secondary/50 rounded-md p-4">
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                {JSON.stringify(responseData, null, 2)}
            </pre>
            </ScrollArea>
        </CardContent>
        </Card>
    );
};

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto mb-6">
            <Card>
                <CardHeader>
                    <CardTitle>Connection Mode</CardTitle>
                    <CardDescription>Select a wallet source for testing and development. The test address holds a variety of common tokens like USDT, LINK, etc.</CardDescription>
                </CardHeader>
                <CardContent>
                    <RadioGroup value={addressSource} onValueChange={(value) => setAddressSource(value as 'wallet' | 'hardcoded')}>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="wallet" id="wallet" />
                            <Label htmlFor="wallet">Connect Your Wallet</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="hardcoded" id="hardcoded" />
                            <Label htmlFor="hardcoded">Use Test Address ({testAddress})</Label>
                        </div>
                    </RadioGroup>
                </CardContent>
            </Card>
        </div>
        {!isConnected && (
           <Card className="mb-6">
            <CardHeader>
              <CardTitle>Welcome to DeFi Commander</CardTitle>
              <CardDescription>Connect your wallet or select the test address to get started.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center p-8">
               <Wallet className="w-16 h-16 text-primary mb-4" />
               <h3 className="text-lg font-semibold mb-2">Please Connect Your Wallet or Use Test Mode</h3>
               <p className="text-muted-foreground mb-4 max-w-md">
                 To view your portfolio, analyze risks, and swap tokens, you need to connect a crypto wallet or select the test address option above.
               </p>
             </CardContent>
           </Card>
        )}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!is1inchApiConfigured && isConnected && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>1inch API Key Not Configured</AlertTitle>
                <AlertDescription>
                  Please add your 1inch API key to the <code>.env</code> file to see your portfolio and swap.
                </AlertDescription>
              </Alert>
            )}
            <PortfolioOverview assets={portfolioAssets} loading={loading} />
            <RiskAssessment 
                address={address}
                portfolio={portfolioAssets} 
                disabled={!isConnected || loading || !is1inchApiConfigured}
                onAnalysisResponse={handleAnalysisResponse}
            />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TokenSwap 
                tokens={tokens} 
                portfolio={portfolioAssets} 
                disabled={!isConnected || loading || !is1inchApiConfigured}
                onQuoteResponse={handleQuoteResponse}
                onGasResponse={handleGasResponse}
            />
          </div>
        </div>
        {isConnected && (
            <>
            <div className="max-w-7xl mx-auto mt-6">
                <h2 className="text-xl font-bold font-headline mb-4">Swap API Responses</h2>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderApiResponseCard(
                    "1inch Quote API",
                    "Fetches a real-time swap quote. Used in the Token Swap component.",
                    apiQuoteResponse
                )}
                {renderApiResponseCard(
                    "1inch Spot Price API",
                    "Fetches token prices for the portfolio overview.",
                    apiSpotPricesResponse
                )}
            </div>
            <div className="max-w-7xl mx-auto mt-6">
                <h2 className="text-xl font-bold font-headline mb-4">AI Risk Assessment API Responses</h2>
            </div>
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {renderApiResponseCard(
                    "AI Risk Assessment",
                    "The context sent to the AI and its generated response.",
                    apiRiskAnalysisResponse
                )}
                 {renderApiResponseCard(
                    "1inch AI: History API",
                    "Fetches a user's transaction history.",
                    apiAiHistoryResponse
                )}
                 {renderApiResponseCard(
                    "1inch AI: Tokens API",
                    "Fetches the list of all swappable tokens.",
                    apiAiTokensResponse
                )}
                 {renderApiResponseCard(
                    "1inch AI: Liquidity Sources API",
                    "Fetches the available liquidity sources on the network.",
                    apiAiLiquidityResponse
                )}
                 {renderApiResponseCard(
                    "1inch AI: Presets API",
                    "Fetches the network presets for routing.",
                    apiAiPresetsResponse
                )}
                 {renderApiResponseCard(
                    "1inch AI: Health Check API",
                    "Checks the status of the 1inch network APIs.",
                    apiAiHealthResponse
                )}
            </div>
            </>
        )}
      </main>
    </div>
  );
}
