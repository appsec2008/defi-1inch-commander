'use server';

async function getTokenPriceDIA(tokenAddress: string, chain = 'ethereum'): Promise<number | null> {
    const url = `https://api.diadata.org/v1/assetQuotation/${chain}/${tokenAddress.toLowerCase()}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch price for ${tokenAddress} from DIA`);
            return null;
        };
        const data = await response.json();
        return data.Price;
    } catch (err) {
        console.error(`Error fetching price for ${tokenAddress} from DIA:`, err);
        return null;
    }
}

export async function getTokenPrices(tokenAddresses: string[]): Promise<{ [key: string]: number | null }> {
  const prices: { [key: string]: number | null } = {};
  
  const pricePromises = tokenAddresses.map(address => getTokenPriceDIA(address));
  const results = await Promise.all(pricePromises);

  tokenAddresses.forEach((address, index) => {
    prices[address] = results[index];
  });

  return prices;
}
