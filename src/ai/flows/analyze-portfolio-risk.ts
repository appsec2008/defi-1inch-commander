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

const prompt = ai.definePrompt({
  name: 'analyzePortfolioRiskPrompt',
  input: {schema: AnalyzePortfolioRiskInputSchema},
  output: {schema: AnalyzePortfolioRiskOutputSchema},
  prompt: `You are an expert portfolio risk analyst and crypto trading strategist.

You will analyze the user's portfolio data and provide a detailed risk summary and actionable recommendations.

First, consider the comprehensive data from the 1inch network for overall context:
{{{portfolioData}}}

Now, focus your recommendations on the user's most significant assets, which are provided here:
{{#if topTokenHoldings}}
**Top Token Holdings (by value):**
{{{topTokenHoldings}}}
{{/if}}

Please provide a detailed:
1.  **Risk Summary**: A general portfolio risk analysis considering token volatility, liquidity, historical trading patterns, and overall market health from the 1inch data.
2.  **Recommendations**: Provide specific, actionable trading strategies focused *directly* on the **Top Token Holdings** listed above. For each of these top tokens, suggest concrete actions like holding, swapping for a stablecoin, or diversifying. Be practical and clear. Also include general advice on token approvals and gas optimization.

Respond thoughtfully. Structure your response into the 'riskSummary' and 'recommendations' output fields. Ensure the recommendations are tailored to the specific top tokens.`,
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
