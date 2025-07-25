import type { Asset } from "@/lib/mock-data";
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
import { iconMap } from "@/lib/mock-data";

interface PortfolioOverviewProps {
  assets: Asset[];
}

export function PortfolioOverview({ assets }: PortfolioOverviewProps) {
  const totalValue = assets.reduce(
    (acc, asset) => acc + asset.balance * asset.price,
    0
  );
  const totalChange = assets.reduce(
    (acc, asset) => acc + (asset.balance * asset.price * asset.change24h) / 100,
    0
  );
  const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100;

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
            <CardTitle className="text-4xl font-bold font-headline">
              {formatCurrency(totalValue)}
            </CardTitle>
          </div>
          <div className="text-right mt-2 sm:mt-0">
            <div
              className={cn(
                "flex items-center justify-end gap-1 text-lg font-semibold",
                totalChange >= 0 ? "text-green-400" : "text-red-400"
              )}
            >
              {totalChange >= 0 ? (
                <ArrowUp className="h-5 w-5" />
              ) : (
                <ArrowDown className="h-5 w-5" />
              )}
              {formatCurrency(Math.abs(totalChange))} (
              {totalChangePercent.toFixed(2)}%)
            </div>
            <p className="text-sm text-muted-foreground">Last 24 hours</p>
          </div>
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
            {assets.map((asset) => {
              const Icon = iconMap[asset.icon];
              return (
                <TableRow key={asset.symbol}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {Icon && <Icon className="w-8 h-8 text-primary" />}
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
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
