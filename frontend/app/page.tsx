"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAccount, useChainId, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, isAddress } from "viem";
import { baseSepolia, arbitrumSepolia } from "wagmi/chains";
import { ConnectButton } from "@/components/ConnectButton";
import { CONTRACTS } from "@/lib/config";
import { ROUTER_ABI, ERC20_ABI } from "@/lib/abis";
import { getBridgeQuote } from "@/lib/across";

const CHAIN_OPTIONS = [
  { id: baseSepolia.id, name: "Base Sepolia" },
  { id: arbitrumSepolia.id, name: "Arbitrum Sepolia" },
];

type Step = "idle" | "approving" | "quoting" | "sending" | "done";

export default function SendPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, data: txHash } = useWriteContract();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [destChainId, setDestChainId] = useState(arbitrumSepolia.id);
  const [message, setMessage] = useState("🎉");
  const [step, setStep] = useState<Step>("idle");
  const [status, setStatus] = useState("");

  const srcConfig = CONTRACTS[chainId as keyof typeof CONTRACTS];
  const dstConfig = CONTRACTS[destChainId as keyof typeof CONTRACTS];

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: srcConfig?.usdc as `0x${string}`,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && srcConfig ? [address, srcConfig.router as `0x${string}`] : undefined,
    query: { enabled: !!address && !!srcConfig },
  });

  const { isLoading: txPending, isSuccess: txSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const isLoading = step !== "idle" && step !== "done";

  async function handleSend() {
    if (!isConnected || !address) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!srcConfig || !dstConfig) {
      toast.error("Switch to Base Sepolia or Arbitrum Sepolia");
      return;
    }
    if (!isAddress(recipient)) {
      toast.error("Invalid recipient address");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (srcConfig.router === "0x0000000000000000000000000000000000000000") {
      toast.error("Router not deployed — update lib/config.ts with deployed addresses");
      return;
    }

    try {
      const amountWei = parseUnits(amount, 6);

      if (!allowance || allowance < amountWei) {
        setStep("approving");
        setStatus("Approving USDC...");
        toast.loading("Approving USDC...", { id: "send" });
        await writeContractAsync({
          address: srcConfig.usdc as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [srcConfig.router as `0x${string}`, amountWei],
        });
        await refetchAllowance();
      }

      setStep("quoting");
      setStatus("Getting Across bridge quote...");
      toast.loading("Getting bridge quote...", { id: "send" });
      const quote = await getBridgeQuote({
        originChainId: chainId,
        destinationChainId: destChainId,
        inputToken: srcConfig.usdc as `0x${string}`,
        outputToken: dstConfig.usdc as `0x${string}`,
        amount: amountWei,
      });

      setStep("sending");
      setStatus("Sending payment + minting postcard...");
      toast.loading("Sending postcard payment...", { id: "send" });
      const hash = await writeContractAsync({
        address: srcConfig.router as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: "sendPayment",
        args: [
          recipient as `0x${string}`,
          srcConfig.usdc as `0x${string}`,
          amountWei,
          quote.outputAmount,
          BigInt(destChainId),
          "USDC",
          dstConfig.chainName,
          message,
          quote.quoteTimestamp,
          quote.fillDeadline,
        ],
      });

      setStep("done");
      setStatus(`Postcard sent! Tx: ${hash}`);
      toast.success("Postcard sent!", { id: "send" });
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setStep("idle");
      setStatus(`Error: ${msg}`);
      toast.error(msg.slice(0, 120), { id: "send" });
    }
  }

  return (
    <main>
      <nav className="nav">
        <div className="nav-links">
          <Link href="/">Send</Link>
          <Link href="/postcards">My Postcards</Link>
        </div>
        <ConnectButton />
      </nav>

      <h1>📬 Send a Postcard Payment</h1>
      <p className="subtitle">
        Bridge USDC via Across and mint a generative NFT postcard on {srcConfig?.chainName ?? "your chain"}.
      </p>

      <div className="card">
        <label>Recipient address</label>
        <input
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
        />

        <label>Amount (USDC)</label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="10"
          type="number"
          min="0"
          step="0.01"
        />

        <label>Destination chain</label>
        <select
          value={destChainId}
          onChange={(e) => setDestChainId(Number(e.target.value))}
        >
          {CHAIN_OPTIONS.filter((c) => c.id !== chainId).map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label>Message / emoji</label>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={32}
        />

        <button className="btn-primary" onClick={handleSend} disabled={isLoading || txPending}>
          {isLoading || txPending ? "Working..." : "Send Postcard"}
        </button>

        {status && <div className="status">{status}</div>}
        {txSuccess && txHash && (
          <div className="status" style={{ marginTop: 8, color: "var(--accent-2)" }}>
            Confirmed: {txHash}
          </div>
        )}
      </div>
    </main>
  );
}
