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
  portfolio: z.string().describe("A JSON string from the 1inch Portfolio API, showing the user's assets as seen by 1inch."),
  history: z.string().describe("A JSON string from the 1inch History API, detailing the user's past transaction events."),
  tokens: z.string().describe("A JSON string from the 1inch Token API, listing all swappable tokens on the network."),
  liquiditySources: z.string().describe("A JSON string from the 1inch Liquidity Sources API, showing available trading protocols."),
  presets: z.string().describe("A JSON string from the 1inch Presets API, detailing network routing configurations."),
  health: z.string().describe("A JSON string from the 1inch Health Check API, indicating the status of the network services."),
  topTokenHoldings: z.string().describe('A focused JSON string of the top 5 token holdings by value from the user\'s wallet, including symbol, name, balance, and price. This data comes from the Moralis API.'),
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

export const prompt = ai.definePrompt({
  name: 'analyzePortfolioRiskPrompt',
  input: {schema: AnalyzePortfolioRiskInputSchema},
  output: {schema: AnalyzePortfolioRiskOutputSchema},
  prompt: `You are an expert portfolio risk analyst and crypto trading strategist. Your goal is to provide a clear, actionable analysis for the user based on the data provided.

You will be given several pieces of data, each from a specific 1inch API endpoint. Use all of this information to build a complete picture of the user's context and the market.

**1. 1inch Portfolio API Data:**
This JSON shows the user's wallet balances from the 1inch perspective.
\`\`\`json
{{{portfolio}}}
\`\`\`

**2. 1inch History API Data:**
This JSON lists the user's recent transaction history. Analyze it for trading frequency, patterns, and risk tolerance.
\`\`\`json
{{{history}}}
\`\`\`

**3. 1inch Tokens API Data:**
This JSON provides a list of all swappable tokens on the network. Use this for general market context.
\`\`\`json
{{{tokens}}}
\`\`\`

**4. 1inch Liquidity Sources & Presets API Data:**
These JSON objects detail the available trading protocols and routing configurations on the network.
Liquidity Sources:
\`\`\`json
{{{liquiditySources}}}
\`\`\`
Presets:
\`\`\`json
{{{presets}}}
\`\`\`

**5. 1inch Health Check API Data:**
This JSON shows the current operational status of the 1inch APIs.
\`\`\`json
{{{health}}}
\`\`\`

**6. User's Top 5 Token Holdings (from Moralis API):**
This is the most important data for your specific recommendations. This JSON shows the user's most significant assets by value.
\`\`\`json
{{{topTokenHoldings}}}
\`\`\`

**Your Task:**

Based on a synthesis of all the information above, please generate the following response:

1.  **Risk Summary**: Write a concise summary of the overall portfolio risk. Consider asset concentration (is it all in one token?), exposure to volatile assets vs. stablecoins, and insights from their transaction history (e.g., are they a frequent trader, do they take profits, etc.).
2.  **Recommendations**: Provide specific, actionable trading strategies focused *directly* on the **Top 5 Token Holdings** listed in the final JSON object. For each of these top tokens, suggest a concrete action, such as holding, swapping for a different asset (e.g., a stablecoin or another token with higher potential), or diversifying. Your recommendations should be practical and clearly justified based on the data. Include general advice on efficient trading, like optimizing gas fees or managing token approvals.

Structure your response into the 'riskSummary' and 'recommendations' output fields.`,
});

const analyzePortfolioRiskFlow = ai.defineFlow(
  {
    name: 'analyzePortfolioRiskFlow',
    inputSchema: AnalyzePortfolioRiskInputSchema,
    outputSchema: AnalyzePortfolioRiskOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
