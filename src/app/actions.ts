'use server';

import { analyzePortfolioRisk } from '@/ai/flows/analyze-portfolio-risk';
import { getTokens, getPortfolio, getHistory, getLiquiditySources, getPresets, getHealthCheck, getQuote, getSwap } from '@/services/1inch';
import { getPortfolioAssets as getMoralisPortfolio } from '@/services/moralis';
import { formatUnits, parseUnits } from 'viem';
import { estimateGas } from '@/services/ethers';


export async function prepareComprehensiveRiskAnalysis(address: string) {
    const ANALYZE_PORTFOLIO_RISK_PROMPT_TEMPLATE = `You are an expert portfolio risk analyst and crypto trading strategist. Your goal is to provide a clear, actionable analysis for the user based on the data provided.

You will be given several pieces of data, each from a specific 1inch API endpoint. Use all of this information to build a complete picture of the user's context and the market.

**1. 1inch Portfolio API Data:**
This JSON object shows the user's wallet balances from the 1inch perspective.
\`\`\`json
{{{json portfolio}}}
\`\`\`

**2. 1inch History API Data:**
This JSON object lists the user's recent transaction history. Analyze it for trading frequency, patterns, and risk tolerance.
\`\`\`json
{{{json history}}}
\`\`\`

**3. 1inch Tokens API Data:**
This JSON array provides a list of all swappable tokens on the network. Use this for general market context.
\`\`\`json
{{{json tokens}}}
\`\`\`

**4. 1inch Liquidity Sources & Presets API Data:**
These JSON objects detail the available trading protocols and routing configurations on the network.
Liquidity Sources:
\`\`\`json
{{{json liquiditySources}}}
\`\`\`
Presets:
\`\`\`json
{{{json presets}}}
\`\`\`

**5. 1inch Health Check API Data:**
This JSON object shows the current operational status of the 1inch APIs.
\`\`\`json
{{{json health}}}
\`\`\`

**6. User's Top 5 Token Holdings (from Moralis API):**
This is the most important data for your specific recommendations. This JSON array shows the user's most significant assets by value.
\`\`\`json
{{{json topTokenHoldings}}}
\`\`\`

**Your Task:**

Based on a synthesis of all the information above, please generate the following response:

1.  **Risk Summary**: Write a concise summary of the overall portfolio risk. Consider asset concentration (is it all in one token?), exposure to volatile assets vs. stablecoins, and insights from their transaction history (e.g., are they a frequent trader, do they take profits, etc.).
2.  **Recommendations**: Provide specific, actionable trading strategies focused *directly* on the **Top 5 Token Holdings** listed in the final JSON object. For each of these top tokens, suggest a concrete action, such as holding, swapping for a different asset (e.g., a stablecoin or another token with higher potential), or diversifying. Your recommendations should be practical and clearly justified based on the data. Include general advice on efficient trading, like optimizing gas fees or managing token approvals.

Structure your response into the 'riskSummary' and 'recommendations' output fields.`;

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
            portfolio: portfolioResult.response,
            history: historyResult.response,
            tokens: tokensResult.tokens.slice(0, 100), // Show only a subset for brevity
            liquiditySources: liquiditySourcesResult.response,
            presets: presetsResult.response,
            health: healthResult.response,
            topTokenHoldings: topHoldings,
        };

        // Construct the full prompt for display purposes in the confirmation dialog
        let fullPromptForDisplay = ANALYZE_PORTFOLIO_RISK_PROMPT_TEMPLATE;
        for (const key in analysisInput) {
            const placeholder = `{{{json ${key}}}}`;
            const value = (analysisInput as any)[key];
            const replacement = JSON.stringify(value, null, 2);
            fullPromptForDisplay = fullPromptForDisplay.replace(new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), replacement);
        }
        
        console.log("Preparation complete. Returning data to client.");
        return { 
            data: {
                analysisInput: analysisInput, // This is sent to the flow
                fullPromptForDisplay: fullPromptForDisplay, // This is shown in the dialog
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
