import { baseSepolia, arbitrumSepolia } from "wagmi/chains";

// Update these after deploying contracts to each testnet
export const CONTRACTS = {
  [baseSepolia.id]: {
    chainName: "Base Sepolia",
    router: "0x0000000000000000000000000000000000000000",
    nft: "0x0000000000000000000000000000000000000000",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    spokePool: "0x82B564983aE7274c86695917BBf8C99ECb6F0F8",
  },
  [arbitrumSepolia.id]: {
    chainName: "Arbitrum Sepolia",
    router: "0x0000000000000000000000000000000000000000",
    nft: "0x0000000000000000000000000000000000000000",
    usdc: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    spokePool: "0x7E63A5f1a8F0B4d0934B2f2327DAED3F6bb2ee75",
  },
} as const;

export const SUPPORTED_CHAINS = [baseSepolia, arbitrumSepolia] as const;
