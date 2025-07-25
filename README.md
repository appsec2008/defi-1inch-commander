# DeFi 1inch Commander

**A submission for ETHGlobal Hackathons: https://ethglobal.com/events/hackathons**

DeFi 1inch Commander is a next-generation decentralized finance (DeFi) dashboard that provides a comprehensive suite of tools for portfolio management, token swapping, and risk analysis, all powered by the 1inch Network APIs, Moralis API, and generative AI.

## What it Does

This DApp empowers users to take command of their DeFi assets with a unified and intuitive interface. Key features include:

*   **Portfolio Aggregation**: Connect your crypto wallet to see an aggregated view of your DeFi portfolio positions across the Ethereum network, powered by the Moralis API.
*   **Balance & PnL Display**: Get a clear overview of your portfolio's total value, individual asset balances, and real-time prices.
*   **AI-Powered Risk Assessment**: Leverage the power of Google's Gemini through Genkit to analyze your portfolio's risk exposure. Receive a detailed summary and actionable recommendations to mitigate risks.
*   **Token Swapping**: Seamlessly swap tokens directly from the dashboard, leveraging the 1inch Aggregation Protocol to ensure the best possible rates.
*   **Optimal Trade Routing**: The swap interface displays the optimal trading route found by the 1inch API, giving you transparency into how your trade is executed.

## Why We Built It

The DeFi landscape is fragmented and can be intimidated for both new and experienced users. Managing assets across different protocols, finding the best swap rates, and understanding portfolio risk requires juggling multiple tools and a high level of expertise.

We built DeFi 1inch Commander to solve these problems by:

1.  **Simplifying Complexity**: Offering a single, elegant dashboard for all key DeFi activities.
2.  **Enhancing Decision-Making**: Providing AI-driven insights that demystify risk and help users make more informed decisions.
3.  **Maximizing Efficiency**: Integrating 1inch's powerful APIs for swapping and Moralis for portfolio data to guarantee efficient trading and data aggregation.

Our goal is to create a powerful yet user-friendly command center for anyone interacting with the world of decentralized finance.

## Technical Architecture

The DApp is built on a modern, robust, and scalable tech stack, designed for a great developer and user experience.

*   **Frontend Framework**: **Next.js** with the App Router for a performant, server-first architecture.
*   **Programming Language**: **TypeScript** for type safety and improved code quality.
*   **UI Components**: **ShadCN UI** and **Tailwind CSS** for a beautiful, responsive, and customizable design system.
*   **AI Integration**: **Genkit** (running Google's Gemini model) for the AI Risk Assessment feature. This allows for powerful, structured AI interactions directly from server components.
*   **Blockchain Connectivity**: **Wagmi** and **Viem** provide robust hooks and utilities for interacting with the Ethereum blockchain.
*   **Wallet Integration**: **WalletConnect (Web3Modal)** for seamless and secure connection to a wide range of crypto wallets.
*   **DeFi Data APIs**: 
    *   **Moralis API**: Used for fetching ERC20 token balances and prices for portfolio aggregation.
    *   **1inch API**: Used for fetching a comprehensive list of swappable tokens and for executing swaps.

## How to Run the Project

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (v18 or later)
*   npm or yarn

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone <your-repo-url>
    cd <repo-directory>
    ```

2.  **Install NPM packages:**
    ```sh
    npm install
    ```

3.  **Set up your environment variables:**
    Create a file named `.env` in the root of your project. You will need to add the following keys:

    *   `NEXT_PUBLIC_ONE_INCH_API_KEY`: Your API key from the [1inch Developer Portal](https://portal.1inch.dev/).
    *   `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`: Your Project ID from [WalletConnect Cloud](https://cloud.walletconnect.com/).
    *   `GEMINI_API_KEY`: Your API key for the Gemini API from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   `MORALIS_API_KEY`: Your API key from [Moralis](https://admin.moralis.io/).

    Your `.env` file should look like this:
    ```
    NEXT_PUBLIC_ONE_INCH_API_KEY=YOUR_1INCH_API_KEY_HERE
    NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_WALLETCONNECT_PROJECT_ID_HERE
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
    MORALIS_API_KEY=YOUR_MORALIS_API_KEY_HERE
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result. You can now connect your wallet and start using the DeFi 1inch Commander!
