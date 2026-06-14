import { createAcrossClient } from "@across-protocol/app-sdk";
import { baseSepolia, arbitrumSepolia } from "wagmi/chains";
import { SUPPORTED_CHAINS } from "./config";

export const acrossClient = createAcrossClient({
  integratorId: "0x00c0",
  chains: [...SUPPORTED_CHAINS],
});

export type BridgeQuote = {
  outputAmount: bigint;
  quoteTimestamp: number;
  fillDeadline: number;
};

type SuggestedFeesResponse = {
  outputAmount: string;
  timestamp: string;
  fillDeadline: string;
};

/**
 * Get an Across bridge quote for depositV3.
 * Uses the suggested-fees API for quoteTimestamp/fillDeadline (required by depositV3),
 * and validates output amount via the app-sdk getSwapQuote when available.
 */
export async function getBridgeQuote(params: {
  originChainId: number;
  destinationChainId: number;
  inputToken: `0x${string}`;
  outputToken: `0x${string}`;
  amount: bigint;
}): Promise<BridgeQuote> {
  const feesUrl = new URL("https://app.across.to/api/suggested-fees");
  feesUrl.searchParams.set("inputToken", params.inputToken);
  feesUrl.searchParams.set("outputToken", params.outputToken);
  feesUrl.searchParams.set("originChainId", params.originChainId.toString());
  feesUrl.searchParams.set("destinationChainId", params.destinationChainId.toString());
  feesUrl.searchParams.set("amount", params.amount.toString());

  const feesRes = await fetch(feesUrl.toString());
  if (!feesRes.ok) {
    const text = await feesRes.text();
    throw new Error(`Across suggested-fees failed: ${feesRes.status} ${text}`);
  }

  const fees = (await feesRes.json()) as SuggestedFeesResponse;

  let outputAmount = BigInt(fees.outputAmount);

  try {
    const swapQuote = await acrossClient.getSwapQuote({
      route: {
        originChainId: params.originChainId,
        destinationChainId: params.destinationChainId,
        inputToken: params.inputToken,
        outputToken: params.outputToken,
      },
      amount: params.amount,
    });

    if (swapQuote.steps?.bridge?.outputAmount) {
      outputAmount = BigInt(swapQuote.steps.bridge.outputAmount);
    } else if (swapQuote.expectedOutputAmount) {
      outputAmount = BigInt(swapQuote.expectedOutputAmount);
    }
  } catch {
    // Fall back to suggested-fees output amount
  }

  return {
    outputAmount,
    quoteTimestamp: Number(fees.timestamp),
    fillDeadline: Number(fees.fillDeadline),
  };
}
