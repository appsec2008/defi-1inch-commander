import { Rocket } from "lucide-react";

export function Header() {
  return (
    <header className="px-4 sm:px-6 md:px-8 py-4 border-b">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Rocket className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold font-headline text-foreground">
          DeFi 1inch Commander
        </h1>
      </div>
    </header>
  );
}
