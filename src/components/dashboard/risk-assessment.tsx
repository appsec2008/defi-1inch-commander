"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { handleComprehensiveRiskAnalysis } from "@/app/actions";
import type { Asset } from "@/lib/types";
import { Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { useAccount } from "wagmi";

interface RiskAssessmentProps {
  portfolio: Asset[];
  disabled: boolean;
}

type AnalysisResult = {
  riskSummary: string;
  recommendations: string;
} | null;

export function RiskAssessment({ portfolio = [], disabled }: RiskAssessmentProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>(null);

  const onAnalyze = async () => {
    if (!address) {
        setError("Wallet is not connected.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysisResult = await handleComprehensiveRiskAnalysis(address);
      if (analysisResult.error) {
        setError(analysisResult.error);
      } else if (analysisResult.data) {
        setResult(analysisResult.data);
      }
    } catch (e) {
      setError("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Risk Assessment</CardTitle>
        <CardDescription>
          Leverage AI to analyze your portfolio's risk exposure and get
          actionable recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!result && !isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Assess Your Risk?</h3>
            <p className="text-muted-foreground mb-4">
              Click the button to get an AI-powered analysis of your current holdings.
            </p>
            <Button onClick={onAnalyze} disabled={isLoading || disabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze Portfolio Risk"
              )}
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Analyzing Portfolio...</h3>
            <p className="text-muted-foreground">
              Our AI is crunching the numbers with comprehensive data from 1inch. This may take a moment.
            </p>
          </div>
        )}

        {error && (
            <div className="text-destructive-foreground bg-destructive/80 p-4 rounded-md text-center">
                <p className="font-semibold">Analysis Failed</p>
                <p>{error}</p>
            </div>
        )}

        {result && (
          <div className="space-y-6">
            <Card className="bg-secondary/50">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                <ShieldCheck className="w-8 h-8 text-accent" />
                <CardTitle>Risk Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.riskSummary}</p>
              </CardContent>
            </Card>

            <Card className="bg-secondary/50">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                 <ShieldCheck className="w-8 h-8 text-accent" />
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{result.recommendations}</p>
              </CardContent>
            </Card>
            
            <div className="text-center">
                <Button onClick={onAnalyze} variant="outline" disabled={isLoading || disabled}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-analyzing...
                    </>
                ) : (
                    "Re-analyze Portfolio"
                )}
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
