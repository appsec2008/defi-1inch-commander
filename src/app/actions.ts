'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens, getPortfolio, getHistory, getLiquiditySources, getPresets, getHealthCheck, getQuote, getSwap } from '@/services/1inch';
import { getPortfolioAssets as getMoralisPortfolio } from '@/services/moralis';
import { formatUnits, parseUnits } from 'viem';
import { estimateGas } from '@/services/ethers';


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
            portfolioResult,
            historyResult,
            tokensResult,
            liquiditySourcesResult,
            presetsResult,
            healthResult,
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

        // Extract clean data instead of raw API responses
        const context = {
            portfolio: portfolioResult.response,
            history: historyResult.response,
            tokens: tokensResult.tokens, 
            liquiditySources: liquiditySourcesResult.response,
            presets: presetsResult.response,
            health: healthResult.response,
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
        
        return { 
            data: analysisResult,
            raw: {
                request: analysisInput,
                response: analysisResult,
            }
        };

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

export async function getSwapAction(fromToken: { address: string, decimals: number, symbol: string }, toToken: { address: string, decimals: number, symbol: string }, fromAmount: string, fromAddress: string) {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
        return { data: null, error: "Invalid amount", raw: {} };
    }
    try {
        const amountInSmallestUnit = parseUnits(fromAmount, fromToken.decimals);
        const { swap, raw, error } = await getSwap(fromToken.address, toToken.address, amountInSmallestUnit.toString(), fromAddress, fromToken.symbol);

        if (error) {
            return { data: null, error, raw };
        }
        
        if (swap && swap.dstAmount) {
            const toAmountFormatted = formatUnits(BigInt(swap.dstAmount), toToken.decimals);
            return { data: { ...swap, dstAmount: toAmountFormatted }, raw, error: null };
        }
        return { data: null, error: 'Failed to get swap data.', raw };
    } catch (e: any) {
        console.error("Swap Action Error:", e);
        return { data: null, error: e.message || 'An unexpected error occurred.', raw: {} };
    }
}


export async function getGasEstimateAction(fromToken: { address: string, decimals: number }, toToken: { address: string, decimals: number }, fromAmount: string, fromAddress: string) {
    if (!fromAmount || isNaN(parseFloat(fromAmount)) || parseFloat(fromAmount) <= 0) {
        return { data: null, error: "Invalid amount", raw: {} };
    }
    try {
        const amountInSmallestUnit = parseUnits(fromAmount, fromToken.decimals);

        // 1. Get swap data (which includes the tx object)
        const { swap, raw: swapRaw, error: swapError } = await getSwap(fromToken.address, toToken.address, amountInSmallestUnit.toString(), fromAddress);

        if (swapError) {
            return { data: null, error: swapError, raw: swapRaw };
        }

        if (!swap || !swap.tx) {
            return { data: null, error: 'Failed to get swap data for gas estimation.', raw: swapRaw };
        }

        // 2. Estimate gas using the tx object
        const gas = await estimateGas(swap.tx);
        
        return { data: { gas }, raw: swapRaw, error: null };

    } catch (e: any) {
        console.error("Gas Estimate Action Error:", e);
        return { data: null, error: e.message || 'An unexpected error occurred.', raw: {} };
    }
}
