"use client";

import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { baseSepolia, arbitrumSepolia } from "wagmi/chains";
import { SUPPORTED_CHAINS } from "./config";

export const wagmiConfig = createConfig({
  chains: SUPPORTED_CHAINS,
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
  ssr: true,
});
