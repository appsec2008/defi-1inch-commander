'use server';

import { analyzePortfolioRisk, prompt as analyzePortfolioRiskPrompt } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens, getPortfolio, getHistory, getLiquiditySources, getPresets, getHealthCheck, getQuote, getSwap } from '@/services/1inch';
import { getPortfolioAssets as getMoralisPortfolio } from '@/services/moralis';
import { formatUnits, parseUnits } from 'viem';
import { estimateGas } from '@/services/ethers';


export async function prepareComprehensiveRiskAnalysis(address: string) {
    try {
        console.log("Starting comprehensive risk analysis preparation for address:", address);
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

        console.log("All API calls completed.");

        // Check for errors in each API call, but don't fail the whole process
        const errors = [
            { name: '1inch Portfolio', error: portfolioResult.error },
            { name: '1inch History', error: historyResult.error },
            { name: '1inch Tokens', error: tokensResult.error },
            { name: '1inch Liquidity Sources', error: liquiditySourcesResult.error },
            { name: '1inch Presets', error: presetsResult.error },
            { name: '1inch Health Check', error: healthResult.error },
            { name: 'Moralis Portfolio', error: moralisPortfolioResult.error },
        ].filter(result => !!result.error);

        if (errors.length > 0) {
            console.warn("One or more API calls failed during data preparation:", errors.map(e => `${e.name}: ${e.error}`).join(', '));
        }

        console.log("Successfully fetched all data. Formatting context...");

        const topHoldings = (moralisPortfolioResult.assets || [])
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
            portfolio: JSON.stringify(portfolioResult.response, null, 2),
            history: JSON.stringify(historyResult.response, null, 2),
            tokens: JSON.stringify(tokensResult.tokens, null, 2),
            liquiditySources: JSON.stringify(liquiditySourcesResult.response, null, 2),
            presets: JSON.stringify(presetsResult.response, null, 2),
            health: JSON.stringify(healthResult.response, null, 2),
            topTokenHoldings: JSON.stringify(topHoldings, null, 2),
        };
        
        // This is where the prompt template is defined in the object from ai.definePrompt
        const promptTemplate = (analyzePortfolioRiskPrompt as any).__config.prompt;

        // Construct the full prompt for display purposes
        let fullPromptForDisplay = promptTemplate || '';
        if (typeof fullPromptForDisplay !== 'string' || !fullPromptForDisplay) {
            const errorMsg = "AI prompt template from Genkit is invalid or empty. Check the flow definition.";
            console.error(errorMsg, analyzePortfolioRiskPrompt);
            return { data: null, error: errorMsg };
        }

        for (const key in analysisInput) {
            // A safer way to handle replacement for Handlebars-style placeholders
            const placeholder = new RegExp(`{{{${key}}}}`, 'g');
            fullPromptForDisplay = fullPromptForDisplay.replace(placeholder, (analysisInput as any)[key]);
        }
        
        console.log("Preparation complete. Returning data to client.");
        return { 
            data: {
                analysisInput: analysisInput,
                fullPromptForDisplay: fullPromptForDisplay,
                raw: {
                    portfolio: portfolioResult,
                    history: historyResult,
                    tokens: tokensResult,
                    liquiditySources: liquiditySourcesResult,
                    presets: presetsResult,
                    health: healthResult,
                }
            },
            error: null
        };

    } catch (error: any) {
        console.error('Critical error during comprehensive risk analysis preparation:', error);
        return { data: null, error: error.message || 'Failed to prepare comprehensive data. Please check the server logs.' };
    }
}


export async function executeComprehensiveRiskAnalysis(input: any) {
    try {
        const analysisResult = await analyzePortfolioRisk(input.analysisInput);
        
        return { 
            data: analysisResult,
            raw: {
                request: input.analysisInput, // Pass the input data for display
                response: analysisResult,
            }
        };

    } catch (error) {
        console.error('Error during comprehensive risk analysis execution:', error);
        return { error: 'Failed to execute risk analysis. Please try again later.' };
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
