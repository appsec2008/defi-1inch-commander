'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens, getPortfolio, getHistory, getLiquiditySources, getPresets, getHealthCheck, getQuote } from '@/services/1inch';
import { getPortfolioAssets as getMoralisPortfolio } from '@/services/moralis';
import { formatUnits, parseUnits } from 'viem';

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


export async function getQuoteAction(fromToken: { address: string, decimals: number }, toToken: { address: string, decimals: number }, fromAmount: string) {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
        return { data: null, error: "Invalid amount" };
    }
    try {
        const amountInSmallestUnit = parseUnits(fromAmount, fromToken.decimals);
        const { quote, error } = await getQuote(fromToken.address, toToken.address, amountInSmallestUnit.toString());

        if (error) {
            return { data: null, error };
        }
        
        if (quote) {
            const toAmountFormatted = formatUnits(BigInt(quote.toAmount), toToken.decimals);
            return { data: { ...quote, toAmount: toAmountFormatted } };
        }
        return { data: null, error: 'Failed to get quote.' };
    } catch (e: any) {
        console.error("Quote Action Error:", e);
        return { data: null, error: e.message || 'An unexpected error occurred.' };
    }
}
