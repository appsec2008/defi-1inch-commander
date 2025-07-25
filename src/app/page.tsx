import { Header } from "@/components/dashboard/header";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { RiskAssessment } from "@/components/dashboard/risk-assessment";
import { TokenSwap } from "@/components/dashboard/token-swap";
import { getPortfolioAssets, getTokens } from "@/services/1inch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default async function Home() {
  const portfolioAssets = await getPortfolioAssets();
  const tokens = await getTokens();

  const isApiConfigured = process.env.ONE_INCH_API_KEY && process.env.ONE_INCH_API_KEY !== 'YOUR_API_KEY_HERE';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {!isApiConfigured && (
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>API Key Not Configured</AlertTitle>
                <AlertDescription>
                  Please add your 1inch API key to the <code>.env</code> file to see live portfolio data. Displaying empty data.
                </AlertDescription>
              </Alert>
            )}
            <PortfolioOverview assets={portfolioAssets} />
            <RiskAssessment portfolio={portfolioAssets} />
          </div>
          <div className="lg:col-span-1 flex flex-col gap-6">
            <TokenSwap tokens={tokens} />
          </div>
        </div>
      </main>
    </div>
  );
}
