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

Given the following comprehensive data from the 1inch network:
{{{portfolioData}}}

Please provide a detailed:
1. Portfolio risk analysis considering token volatility, liquidity, historical trading patterns, and overall market health.
2. Suggested trading strategies to optimize returns and mitigate identified risks.
3. Advice on token approvals and gas optimization for more efficient trading based on the provided data.

Respond thoughtfully and practically. Structure your response into the 'riskSummary' and 'recommendations' output fields.`,
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
