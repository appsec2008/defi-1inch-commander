'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens } from '@/services/1inch';
import { getPortfolioAssets as getMoralisPortfolio } from '@/services/moralis';

export async function handleRiskAnalysis(portfolio: string) {
  try {
    const result = await analyzePortfolioRisk({ portfolioData: portfolio });
    return { data: result };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to analyze portfolio risk. Please try again later.' };
  }
}

export async function getPortfolioAction(address: string) {
  return getMoralisPortfolio(address);
}

export async function getTokensAction() {
    return getTokens();
}
