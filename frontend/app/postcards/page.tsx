"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAccount, useChainId, useReadContract } from "wagmi";
import { ConnectButton } from "@/components/ConnectButton";
import { CONTRACTS } from "@/lib/config";
import { NFT_ABI } from "@/lib/abis";
import { decodePostcardUri } from "@/lib/postcard";

type PostcardItem = {
  tokenId: bigint;
  name: string;
  image: string;
};

export default function PostcardsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = CONTRACTS[chainId as keyof typeof CONTRACTS];

  const [postcards, setPostcards] = useState<PostcardItem[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: balance } = useReadContract({
    address: config?.nft as `0x${string}`,
    abi: NFT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!config && config.nft !== "0x0000000000000000000000000000000000000000",
    },
  });

  useEffect(() => {
    async function loadPostcards() {
      if (!address || !config || !balance || balance === 0n) {
        setPostcards([]);
        return;
      }
      if (config.nft === "0x0000000000000000000000000000000000000000") return;

      setLoading(true);
      try {
        const { createPublicClient, http } = await import("viem");
        const { baseSepolia, arbitrumSepolia } = await import("wagmi/chains");

        const chain = chainId === baseSepolia.id ? baseSepolia : arbitrumSepolia;
        const client = createPublicClient({ chain, transport: http() });

        const items: PostcardItem[] = [];
        for (let i = 0n; i < balance; i++) {
          const tokenId = await client.readContract({
            address: config.nft as `0x${string}`,
            abi: NFT_ABI,
            functionName: "tokenOfOwnerByIndex",
            args: [address, i],
          });

          const uri = await client.readContract({
            address: config.nft as `0x${string}`,
            abi: NFT_ABI,
            functionName: "tokenURI",
            args: [tokenId],
          });

          const decoded = decodePostcardUri(uri);
          if (decoded) {
            items.push({ tokenId, name: decoded.name, image: decoded.image });
          }
        }
        setPostcards(items);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load postcards");
      } finally {
        setLoading(false);
      }
    }

    loadPostcards();
  }, [address, balance, chainId, config]);

  return (
    <main>
      <nav className="nav">
        <div className="nav-links">
          <Link href="/">Send</Link>
          <Link href="/postcards">My Postcards</Link>
        </div>
        <ConnectButton />
      </nav>

      <h1>📮 My Postcards</h1>
      <p className="subtitle">
        {config?.chainName ?? "Connect wallet"} — generative payment receipts you&apos;ve received.
      </p>

      {!isConnected && <div className="empty">Connect your wallet to view postcards.</div>}

      {isConnected && config?.nft === "0x0000000000000000000000000000000000000000" && (
        <div className="empty">NFT contract not configured — deploy and update lib/config.ts.</div>
      )}

      {isConnected && loading && <div className="empty">Loading postcards...</div>}

      {isConnected && !loading && postcards.length === 0 && config?.nft !== "0x0000000000000000000000000000000000000000" && (
        <div className="empty">No postcards yet. Send or receive a payment to get one!</div>
      )}

      <div className="gallery">
        {postcards.map((p) => (
          <div key={p.tokenId.toString()} className="postcard-card">
            <img src={p.image} alt={p.name} />
            <div className="meta">{p.name}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
