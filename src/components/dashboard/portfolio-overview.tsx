import type { Asset } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";


interface PortfolioOverviewProps {
  assets: Asset[];
  loading: boolean;
  isApiConfigured: boolean;
}

export function PortfolioOverview({ assets = [], loading, isApiConfigured }: PortfolioOverviewProps) {
  const totalValue = assets.reduce(
    (acc, asset) => acc + asset.balance * asset.price,
    0
  );
  const totalChange24hValue = assets.reduce(
    (acc, asset) => acc + (asset.balance * asset.price * (asset.change24h / 100)),
    0
  );

  const previousTotalValue = totalValue - totalChange24hValue;
  const totalChangePercent = previousTotalValue !== 0 ? (totalChange24hValue / previousTotalValue) * 100 : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardDescription>Portfolio Value</CardDescription>
            {loading ? <Skeleton className="h-10 w-48 mt-1" /> : (
              <CardTitle className="text-4xl font-bold font-headline">
                {formatCurrency(totalValue)}
              </CardTitle>
            )}
          </div>
           {loading ? <Skeleton className="h-10 w-36 mt-2 sm:mt-0" /> : (
              <div className="text-right mt-2 sm:mt-0">
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 text-lg font-semibold",
                    totalChange24hValue >= 0 ? "text-green-400" : "text-red-400"
                  )}
                >
                  {totalChange24hValue >= 0 ? (
                    <ArrowUp className="h-5 w-5" />
                  ) : (
                    <ArrowDown className="h-5 w-5" />
                  )}
                  {formatCurrency(Math.abs(totalChange24hValue))} (
                  {totalChangePercent.toFixed(2)}%)
                </div>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </div>
           )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Balance</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">24h Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                        <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-24 ml-auto" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-6 w-16 ml-auto" /></TableCell>
                    </TableRow>
                ))
            ) : assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow key={asset.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {asset.icon ? (
                         <Image src={asset.icon} alt={`${asset.name} logo`} width={32} height={32} className="rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                          {asset.symbol.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {asset.symbol}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {asset.balance.toFixed(4)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(asset.price)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(asset.balance * asset.price)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      asset.change24h >= 0 ? "text-green-400" : "text-red-400"
                    )}
                  >
                    {asset.change24h.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  {isApiConfigured ? 'No assets found.' : 'Moralis API Key not configured.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
