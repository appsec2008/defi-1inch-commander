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
  portfolioData: z.string().describe('A comprehensive JSON string containing portfolio, history, tokens, liquidity sources, presets, and health status from the 1inch API.'),
  topTokenHoldings: z.string().describe('A focused JSON string of the top 5 token holdings by value from the user\'s wallet, including symbol, name, balance, and price.').optional(),
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

First, I will provide you with a comprehensive set of data from the 1inch Network APIs. This data includes the user's portfolio as seen by 1inch, their transaction history, a list of all swappable tokens, available liquidity sources, and the current health status of the 1inch network. Use this information to form a broad understanding of the market context and the user's general trading profile.

**1inch Network Data:**
\`\`\`json
{{{portfolioData}}}
\`\`\`

Next, I will provide a focused list of the user's **Top 5 Token Holdings** by current market value. This is the most important part of the analysis. Your recommendations must be tailored specifically to these assets.

**User's Top 5 Token Holdings (by value):**
\`\`\`json
{{{topTokenHoldings}}}
\`\`\`

Based on all the information above, please generate the following response:

1.  **Risk Summary**: Write a concise summary of the overall portfolio risk. Consider factors like asset concentration, exposure to volatile assets vs. stablecoins, and any insights you can glean from their transaction history (e.g., are they a frequent trader, do they take profits, etc.).
2.  **Recommendations**: Provide specific, actionable trading strategies focused *directly* on the **Top 5 Token Holdings** listed above. For each of these top tokens, suggest a concrete action, such as holding, swapping for a different asset (e.g., a stablecoin or another token with higher potential), or diversifying. Your recommendations should be practical and clearly justified based on the data. Include general advice on efficient trading, like optimizing gas fees or managing token approvals.

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
