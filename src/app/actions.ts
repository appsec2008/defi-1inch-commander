'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens, getPortfolio, getHistory, getLiquiditySources, getPresets, getHealthCheck } from '@/services/1inch';
import { getPortfolioAssets as getMoralisPortfolio } from '@/services/moralis';
import { useAccount } from 'wagmi';

export async function handleRiskAnalysis(portfolio: string) {
  try {
    const result = await analyzePortfolioRisk({ portfolioData: portfolio });
    return { data: result };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to analyze portfolio risk. Please try again later.' };
  }
}

export async function handleComprehensiveRiskAnalysis(address: string) {
    try {
        const [
            portfolio,
            history,
            tokens,
            liquiditySources,
            presets,
            health,
        ] = await Promise.all([
            getPortfolio(address),
            getHistory(address),
            getTokens(),
            getLiquiditySources(),
            getPresets(),
            getHealthCheck(),
        ]);

        const context = {
            portfolio,
            history,
            tokens: tokens.tokens, // we only need the token list
            liquiditySources,
            presets,
            health,
        };

        const analysisResult = await analyzePortfolioRisk({ portfolioData: JSON.stringify(context, null, 2) });
        return { data: analysisResult };

    } catch (error) {
        console.error('Error during comprehensive risk analysis:', error);
        return { error: 'Failed to fetch comprehensive data from 1inch. Please try again later.' };
    }
}


export async function getPortfolioAction(address: string) {
  return getMoralisPortfolio(address);
}

export async function getTokensAction() {
    return getTokens();
}
