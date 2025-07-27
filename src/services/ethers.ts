'use server';
import { ethers, BigNumber } from 'ethers';
import type { SwapTransaction } from '@/lib/types';

// Using a public RPC to avoid needing another environment variable.
// In a production app, you'd want to use a dedicated provider like Infura or Alchemy.
const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth');

export async function estimateGas(tx: SwapTransaction): Promise<string> {
    try {
        const transaction = {
            from: tx.from,
            to: tx.to,
            data: tx.data,
            value: BigNumber.from(tx.value || '0'),
        };
        const estimatedGas = await provider.estimateGas(transaction);
        return estimatedGas.toString();
    } catch (error: any) {
        console.error('Error estimating gas with Ethers:', error);
        // Return a nominal value if estimation fails
        return '150000'; 
    }
}
