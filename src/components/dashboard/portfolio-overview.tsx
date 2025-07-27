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
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from 'next/image';
import { Skeleton } from "@/components/ui/skeleton";


interface PortfolioOverviewProps {
  assets: Asset[];
  loading: boolean;
  isMoralisApiConfigured: boolean;
}

export function PortfolioOverview({ assets = [], loading, isMoralisApiConfigured }: PortfolioOverviewProps) {
  const totalValue = assets.reduce(
    (acc, asset) => acc + asset.balance * asset.price,
    0
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);

  // Since 1inch spot price doesn't provide 24h change, we will hide this section for now.
  const has24hChangeData = assets.some(asset => asset.change24h !== 0 && asset.change24h !== undefined);

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
           {loading ? <Skeleton className="h-10 w-36 mt-2 sm:mt-0" /> : has24hChangeData ? (
              <div className="text-right mt-2 sm:mt-0">
                <div
                  className={cn(
                    "flex items-center justify-end gap-1 text-lg font-semibold",
                    "text-gray-500" // Placeholder color
                  )}
                >
                  <Minus className="h-5 w-5" />
                  N/A
                </div>
                <p className="text-sm text-muted-foreground">Last 24 hours</p>
              </div>
           ) : null}
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
                          {asset.symbol ? asset.symbol.charAt(0) : '?'}
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
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24">
                  {!isMoralisApiConfigured ? 'Moralis API Key not configured.' : 'No assets found.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
