import { Header } from "@/components/dashboard/header";
import { PortfolioOverview } from "@/components/dashboard/portfolio-overview";
import { RiskAssessment } from "@/components/dashboard/risk-assessment";
import { TokenSwap } from "@/components/dashboard/token-swap";
import { portfolioAssets, tokens } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
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
