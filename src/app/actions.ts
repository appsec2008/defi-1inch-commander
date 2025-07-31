
'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens, getHistory, getLiquiditySources, getPresets, getHealthCheck, getQuote, getSwap, getPortfolio } from '@/services/1inch';
import { formatUnits, parseUnits } from 'viem';
import { estimateGas } from '@/services/ethers';


const PROMPT_TEMPLATE_FOR_DISPLAY = `You are an expert portfolio risk analyst and crypto trading strategist. Your goal is to provide a clear, actionable analysis for the user based on the data provided.

You will be given several pieces of data, each from a specific 1inch API endpoint. Use all of this information to build a complete picture of the user's context and the market.

**1. User's Top Token Holdings (Derived from 1inch Balance API):**
This is the most important data for your specific recommendations. This JSON array shows the user's most significant assets by value. Treat this as the primary portfolio data for making concrete suggestions.
\`\`\`json
{{{json topTokenHoldings}}}
\`\`\`

**2. Full Portfolio (from 1inch Balance API):**
This is the full list of token balances for the user's wallet. Use this to understand the full scope and diversity of the portfolio, including long-tail assets.
\`\`\`json
{{{json fullPortfolio}}}
\`\`\`

**3. 1inch History API Data:**
This JSON object lists the user's recent transaction history. Analyze it for trading frequency, patterns, and risk tolerance.
\`\`\`json
{{{history}}}
\`\`\`

**4. 1inch Liquidity Sources & Presets API Data:**
These JSON objects detail the available trading protocols and routing configurations on the network. This provides context about the current trading environment.
Liquidity Sources:
\`\`\`json
{{{liquiditySources}}}
\`\`\`
Presets:
\`\`\`json
{{{presets}}}
\`\`\`

**Your Task:**

Based on a synthesis of all the information above, please generate the following response:

1.  **Risk Summary**: Write a concise summary of the overall portfolio risk. Consider asset concentration (is it all in one token?), exposure to volatile assets vs. stablecoins, and insights from their transaction history (e.g., are they a frequent trader, do they take profits, etc.).
2.  **Recommendations**: Provide specific, actionable trading strategies focused *directly* on the **Top Token Holdings** listed first. For each of these top tokens, suggest a concrete action, such as holding, swapping for a different asset (e.g., a stablecoin or another token with higher potential), or diversifying. Your recommendations should be practical and clearly justified based on the data. Include general advice on efficient trading, like optimizing gas fees or managing token approvals.

Structure your response into the 'riskSummary' and 'recommendations' output fields.`;


export async function prepareComprehensiveRiskAnalysis(address: string) {

    try {
        console.log("Starting comprehensive risk analysis preparation for address:", address);
        const [
            historyResult,
            liquiditySourcesResult,
            presetsResult,
            healthCheckResult,
            portfolioResult,
        ] = await Promise.all([
            getHistory(address),
            getLiquiditySources(),
            getPresets(),
            getHealthCheck(),
            getPortfolio(address)
        ]);

        console.log("All API calls completed.");

        const errors = [
            { name: '1inch History', error: historyResult.error },
            { name: '1inch Liquidity Sources', error: liquiditySourcesResult.error },
            { name: '1inch Presets', error: presetsResult.error },
            { name: '1inch Health Check', error: healthCheckResult.error },
            { name: '1inch Portfolio', error: portfolioResult.error },
        ].filter(result => !!result.error);

        if (errors.length > 0) {
            console.warn("One or more API calls failed during data preparation:", errors.map(e => `${e.name}: ${e.error}`).join(', '));
        }

        console.log("Successfully fetched all data. Formatting context...");
        
        const analysisInput = {
            topTokenHoldings: portfolioResult.assets,
            fullPortfolio: portfolioResult.raw,
            history: historyResult.response,
            liquiditySources: liquiditySourcesResult.response,
            presets: presetsResult.response,
        };

        const fullPromptForDisplay = PROMPT_TEMPLATE_FOR_DISPLAY
            .replace('{{{json topTokenHoldings}}}', JSON.stringify(analysisInput.topTokenHoldings, null, 2))
            .replace('{{{json fullPortfolio}}}', JSON.stringify(analysisInput.fullPortfolio, null, 2))
            .replace('{{{history}}}', JSON.stringify(analysisInput.history, null, 2))
            .replace('{{{liquiditySources}}}', JSON.stringify(analysisInput.liquiditySources, null, 2))
            .replace('{{{presets}}}', JSON.stringify(analysisInput.presets, null, 2));
        
        console.log("Preparation complete. Returning data to client.");
        return { 
            data: {
                analysisInput: analysisInput,
                fullPromptForDisplay: fullPromptForDisplay,
                raw: {
                    history: historyResult,
                    liquiditySources: liquiditySourcesResult,
                    presets: presetsResult,
                    healthCheck: healthCheckResult,
                    portfolio: portfolioResult.raw,
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
                request: input.analysisInput,
                response: analysisResult,
            }
        };

    } catch (error) {
        console.error('Error during comprehensive risk analysis execution:', error);
        return { error: 'Failed to execute risk analysis. Please try again later.' };
    }
}


export async function getPortfolioAction(address: string) {
  return getPortfolio(address);
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
        
        if (quote && quote.toAmount) {
            const formattedQuote = {
                ...quote,
                toAmount: formatUnits(BigInt(quote.toAmount), toToken.decimals),
            }
            return { data: formattedQuote, raw, error: null };
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
