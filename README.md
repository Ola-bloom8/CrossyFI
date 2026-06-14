# Postcard

Cross-chain payment app for ETH Hackathon — send USDC across chains and mint a generative on-chain NFT "postcard" to the recipient.

## Structure

- `contracts/` — Foundry (PostcardNFT, PostcardRouter)
- `frontend/` — Next.js + wagmi + viem

## Quick start

### Contracts

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std --no-commit
forge build
forge test
```

### Deploy (testnet)

```bash
# Base Sepolia
export PRIVATE_KEY=...
export SPOKE_POOL=0x82B564983aE7274c86695917BBf8C99ECb6F0F8
export CHAIN_NAME="Base Sepolia"
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast

# Arbitrum Sepolia
export SPOKE_POOL=0x7E63A5f1a8F0B4d0934B2f2327DAED3F6bb2ee75
export CHAIN_NAME="Arbitrum Sepolia"
forge script script/Deploy.s.sol --rpc-url $ARB_SEPOLIA_RPC --broadcast
```

Update `frontend/lib/config.ts` with deployed addresses.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Testnet USDC

- Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`
- Arbitrum Sepolia: `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d`

Get testnet USDC from [Circle faucet](https://faucet.circle.com/).
