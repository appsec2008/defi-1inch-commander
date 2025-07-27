"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prepareComprehensiveRiskAnalysis, executeComprehensiveRiskAnalysis } from "@/app/actions";
import type { Asset } from "@/lib/types";
import { Loader2, ShieldAlert, ShieldCheck, Forward } from "lucide-react";
import { useAccount } from "wagmi";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


interface RiskAssessmentProps {
  portfolio: Asset[];
  disabled: boolean;
  onAnalysisResponse: (response: any) => void;
}

type AnalysisResult = {
  riskSummary: string;
  recommendations: string;
} | null;

type PreparedData = {
    analysisInput: any;
    raw: any;
} | null;

// A simple markdown renderer
const renderMarkdown = (text: string) => {
    // Replace **text** with <strong>text</strong>
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Replace newlines with <br />
    formattedText = formattedText.replace(/\n/g, '<br />');
    return { __html: formattedText };
}


export function RiskAssessment({ portfolio = [], disabled, onAnalysisResponse }: RiskAssessmentProps) {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult>(null);
  const [preparedData, setPreparedData] = useState<PreparedData>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (preparedData) {
      setIsConfirmDialogOpen(true);
    }
  }, [preparedData]);


  const onPrepare = async () => {
    if (!address) {
        setError("Wallet is not connected.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    setPreparedData(null);
    onAnalysisResponse({}); // Clear previous raw response

    try {
      const preparationResult = await prepareComprehensiveRiskAnalysis(address);
      if (preparationResult.error) {
        setError(preparationResult.error);
      } else if (preparationResult.data) {
        setPreparedData(preparationResult.data);
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred during preparation.");
    } finally {
      setIsLoading(false);
    }
  };

  const onExecute = async () => {
    if (!preparedData) {
        setError("No prepared data available to execute.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);
    onAnalysisResponse({ raw: preparedData.raw }); // Show raw data for individual cards
    
    try {
      const analysisResult = await executeComprehensiveRiskAnalysis(preparedData);
      onAnalysisResponse({ raw: preparedData.raw, ai: { ...analysisResult.raw, request: preparedData.analysisInput } });

      if (analysisResult.error) {
        setError(analysisResult.error);
      } else if (analysisResult.data) {
        setResult(analysisResult.data);
      }
    } catch (e) {
      setError("An unexpected error occurred during execution.");
    } finally {
      setIsLoading(false);
      setIsConfirmDialogOpen(false); // Close the dialog
    }
  };

  const onCancel = () => {
    setPreparedData(null);
    setIsConfirmDialogOpen(false);
  }

  const onRestart = () => {
    setResult(null);
    setPreparedData(null);
    setError(null);
    onAnalysisResponse({});
  }

  return (
    <>
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
              Click the button to prepare the analysis and review the data that will be sent to the AI.
            </p>
            <Button onClick={onPrepare} disabled={isLoading || disabled}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Preparing...
                </>
              ) : (
                "Analyze Portfolio Risk"
              )}
            </Button>
          </div>
        )}

        {isLoading && !result && !isConfirmDialogOpen && (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
            <h3 className="text-lg font-semibold">Analyzing Portfolio...</h3>
            <p className="text-muted-foreground">
              Our AI is crunching the numbers. This may take a moment.
            </p>
          </div>
        )}

        {error && (
            <div className="text-destructive-foreground bg-destructive/80 p-4 rounded-md text-center">
                <p className="font-semibold">Analysis Failed</p>
                <p>{error}</p>
                 <Button onClick={onRestart} variant="secondary" className="mt-4">Try Again</Button>
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
                <p className="text-muted-foreground" dangerouslySetInnerHTML={renderMarkdown(result.riskSummary)} />
              </CardContent>
            </Card>

            <Card className="bg-secondary/50">
              <CardHeader className="flex-row items-center gap-4 space-y-0">
                 <ShieldCheck className="w-8 h-8 text-accent" />
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground" dangerouslySetInnerHTML={renderMarkdown(result.recommendations)} />
              </CardContent>
            </Card>
            
            <div className="text-center">
                <Button onClick={onRestart} variant="outline" disabled={isLoading}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Re-analyzing...
                    </>
                ) : (
                    "Start New Analysis"
                )}
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-3xl">
            <AlertDialogHeader>
                <AlertDialogTitle>Confirm AI Analysis Input</AlertDialogTitle>
                <AlertDialogDescription>
                    This is the data that will be sent to the AI for analysis. Review it and click confirm to continue.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <ScrollArea className="h-[50vh] w-full bg-secondary/50 rounded-md p-4 border">
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {JSON.stringify(preparedData?.analysisInput, null, 2)}
                </pre>
            </ScrollArea>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onExecute} disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analyzing...</> : <><Forward className="mr-2 h-4 w-4" />Confirm and Continue</>}
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
