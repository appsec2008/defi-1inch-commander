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
  portfolioData: z.string().describe('Portfolio data from the 1inch API.'),
});
export type AnalyzePortfolioRiskInput = z.infer<typeof AnalyzePortfolioRiskInputSchema>;

const AnalyzePortfolioRiskOutputSchema = z.object({
  riskSummary: z.string().describe('A summary of the portfolio risk exposure.'),
  recommendations: z.string().describe('Recommendations for mitigating risk.'),
});
export type AnalyzePortfolioRiskOutput = z.infer<typeof AnalyzePortfolioRiskOutputSchema>;

export async function analyzePortfolioRisk(input: AnalyzePortfolioRiskInput): Promise<AnalyzePortfolioRiskOutput> {
  return analyzePortfolioRiskFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzePortfolioRiskPrompt',
  input: {schema: AnalyzePortfolioRiskInputSchema},
  output: {schema: AnalyzePortfolioRiskOutputSchema},
  prompt: `You are an expert in DeFi portfolio risk analysis.

You will analyze the user's portfolio data and provide a risk summary and recommendations for mitigating risk.

Portfolio Data:
{{{portfolioData}}}`,
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
