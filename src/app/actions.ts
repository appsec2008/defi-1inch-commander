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
            moralisPortfolioResult,
        ] = await Promise.all([
            getPortfolio(address),
            getHistory(address),
            getTokens(),
            getLiquiditySources(),
            getPresets(),
            getHealthCheck(),
            getMoralisPortfolio(address), // Fetch portfolio to identify top assets
        ]);

        const context = {
            portfolio,
            history,
            tokens: tokens.tokens, // we only need the token list
            liquiditySources,
            presets,
            health,
        };

        // Identify top 5 token holdings by value
        const topHoldings = moralisPortfolioResult.assets
            .sort((a, b) => (b.balance * b.price) - (a.balance * a.price))
            .slice(0, 5)
            .map(asset => ({
                name: asset.name,
                symbol: asset.symbol,
                balance: asset.balance,
                price: asset.price,
                value: asset.balance * asset.price,
            }));

        const analysisInput = {
             portfolioData: JSON.stringify(context, null, 2),
             topTokenHoldings: JSON.stringify(topHoldings, null, 2),
        };

        const analysisResult = await analyzePortfolioRisk(analysisInput);
        return { data: analysisResult };

    } catch (error) {
        console.error('Error during comprehensive risk analysis:', error);
        return { error: 'Failed to fetch comprehensive data. Please try again later.' };
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
        return { data: null, error: "Invalid amount", raw: {} };
    }
    try {
        const amountInSmallestUnit = parseUnits(fromAmount, fromToken.decimals);
        const { quote, raw, error } = await getQuote(fromToken.address, toToken.address, amountInSmallestUnit.toString());

        if (error) {
            return { data: null, error, raw };
        }
        
        if (quote && quote.dstAmount) {
            const toAmountFormatted = formatUnits(BigInt(quote.dstAmount), toToken.decimals);
            return { data: { ...quote, dstAmount: toAmountFormatted }, raw, error: null };
        }
        return { data: null, error: 'Failed to get quote.', raw };
    } catch (e: any) {
        console.error("Quote Action Error:", e);
        return { data: null, error: e.message || 'An unexpected error occurred.', raw: {} };
    }
}
