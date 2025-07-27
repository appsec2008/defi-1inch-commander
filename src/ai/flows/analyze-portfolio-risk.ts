'use server';

/**
 * @fileOverview A portfolio risk analysis AI agent.
 *
 * - analyzePortfolioRisk - A function that handles the portfolio risk analysis process.
 * - AnalyzePortfolioRiskInput - The input type for the analyzePortfolioRisk function.
 * - AnalyzePortfolioRiskOutput - The return type for the analyzePortfolioRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePortfolioRiskInputSchema = z.object({
  topTokenHoldings: z.any().describe('A focused JSON array of the top token holdings by value from the user\'s wallet, including symbol, name, balance, and price. This data comes from the 1inch Balance API and should be treated as the primary source for the user\'s portfolio.'),
  fullPortfolio: z.any().describe("A JSON object from the 1inch Balance API, showing all token balances for the user's wallet."),
  history: z.any().describe("A JSON object from the 1inch History API, detailing the user's past transaction events."),
  liquiditySources: z.any().describe("A JSON object from the 1inch Liquidity Sources API, showing available trading protocols."),
  presets: z.any().describe("A JSON object from the 1inch Presets API, detailing network routing configurations."),
});
export type AnalyzePortfolioRiskInput = z.infer<typeof AnalyzePortfolioRiskInputSchema>;

const AnalyzePortfolioRiskOutputSchema = z.object({
  riskSummary: z.string().describe("A detailed portfolio risk analysis considering token volatility, liquidity, and historical trading patterns."),
  recommendations: z.string().describe("Suggested trading strategies to optimize returns and reduce risk, including advice on approvals and gas optimization for efficient trading."),
});
export type AnalyzePortfolioRiskOutput = z.infer<typeof AnalyzePortfolioRiskOutputSchema>;

export async function analyzePortfolioRisk(input: AnalyzePortfolioRiskInput): Promise<AnalyzePortfolioRiskOutput> {
  return analyzePortfolioRiskFlow(input);
}

// NOTE: The user-facing prompt template is now located in `src/app/actions.ts`
// to avoid "use server" build errors when importing it into UI components.
// This template here is the one used by the AI flow itself.
const ANALYZE_PORTFOLIO_RISK_PROMPT_TEMPLATE = `You are an expert portfolio risk analyst and crypto trading strategist. Your goal is to provide a clear, actionable analysis for the user based on the data provided.

You will be given several pieces of data, each from a specific 1inch API endpoint. Use all of this information to build a complete picture of the user's context and the market.

**1. User's Top Token Holdings (Derived from 1inch Balance API):**
This is the most important data for your specific recommendations. This JSON array shows the user's most significant assets by value. Treat this as the primary portfolio data for making concrete suggestions.
\`\`\`json
{{{json topTokenHoldings}}}
\`\`\`

**2. Full Portfolio (from 1inch Balance API):**
This JSON object provides the complete list of all token balances for the user's wallet. Use this to understand the full scope and diversity of the portfolio, including long-tail assets.
\`\`\`json
{{{json fullPortfolio}}}
\`\`\`

**3. 1inch History API Data:**
This JSON object lists the user's recent transaction history. Analyze it for trading frequency, patterns, and risk tolerance.
\`\`\`json
{{{json history}}}
\`\`\`

**4. 1inch Liquidity Sources & Presets API Data:**
These JSON objects detail the available trading protocols and routing configurations on the network. This provides context about the current trading environment.
Liquidity Sources:
\`\`\`json
{{{json liquiditySources}}}
\`\`\`
Presets:
\`\`\`json
{{{json presets}}}
\`\`\`

**Your Task:**

Based on a synthesis of all the information above, please generate the following response:

1.  **Risk Summary**: Write a concise summary of the overall portfolio risk. Consider asset concentration (is it all in one token?), exposure to volatile assets vs. stablecoins, and insights from their transaction history (e.g., are they a frequent trader, do they take profits, etc.).
2.  **Recommendations**: Provide specific, actionable trading strategies focused *directly* on the **Top Token Holdings** listed first. For each of these top tokens, suggest a concrete action, such as holding, swapping for a different asset (e.g., a stablecoin or another token with higher potential), or diversifying. Your recommendations should be practical and clearly justified based on the data. Include general advice on efficient trading, like optimizing gas fees or managing token approvals.

Structure your response into the 'riskSummary' and 'recommendations' output fields.`;


const analyzePortfolioRiskPrompt = ai.definePrompt({
  name: 'analyzePortfolioRiskPrompt',
  input: {schema: AnalyzePortfolioRiskInputSchema},
  output: {schema: AnalyzePortfolioRiskOutputSchema},
  prompt: ANALYZE_PORTFOLIO_RISK_PROMPT_TEMPLATE,
});

const analyzePortfolioRiskFlow = ai.defineFlow(
  {
    name: 'analyzePortfolioRiskFlow',
    inputSchema: AnalyzePortfolioRiskInputSchema,
    outputSchema: AnalyzePortfolioRiskOutputSchema,
  },
  async input => {
    const {output} = await analyzePortfolioRiskPrompt(input);
    return output!;
  }
);
