'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getPortfolioAssets, getTokens } from '@/services/1inch';

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
  return getPortfolioAssets(address);
}

export async function getTokensAction() {
    return getTokens();
}