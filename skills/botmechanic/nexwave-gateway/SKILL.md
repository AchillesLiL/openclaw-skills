---
name: nexwave-gateway
description: Unified crosschain USDC balance via Circle Gateway. Deposit USDC on any supported chain, check your unified balance, and instantly mint USDC on any destination chain in <500ms — no bridging, no liquidity pools, no waiting.
version: 1.0.0
tags:
  - usdc
  - circle
  - gateway
  - crosschain
  - defi
  - payments
  - agent-commerce
author: nexwave
requiredEnv:
  - PRIVATE_KEY
---

# Nexwave Gateway — Unified Crosschain USDC for OpenClaw Agents

## What This Skill Does

Circle Gateway gives you a **single unified USDC balance** that is instantly accessible on any supported chain in under 500 milliseconds. Instead of holding separate USDC balances on Ethereum, Base, Avalanche, etc., you deposit USDC into Gateway on any chain and can mint it out on any other chain — instantly.

This is fundamentally different from bridging. There are no liquidity pools, no bridge operators, no 15-minute waits. Gateway uses a deposit → sign burn intent → receive attestation → mint flow that executes in <500ms.

## Supported Chains (Testnet)

| Chain | Domain ID | USDC Address |
|---|---|---|
| Ethereum Sepolia | 0 | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| Avalanche Fuji | 1 | `0x5425890298aed601595a70ab815c96711a31bc65` |
| Base Sepolia | 6 | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

**Gateway Contracts (same address on all EVM chains):**
- Gateway Wallet: `0x0077777d7EBA4688BDeF3E311b846F25870A19B9`
- Gateway Minter: `0x0022222ABE238Cc2C7Bb1f21003F0a260052475B`

**Gateway API (testnet):** `https://gateway-api-testnet.circle.com/v1`

## Prerequisites

1. An Ethereum-compatible private key set as `PRIVATE_KEY` in your environment
2. Testnet USDC from https://faucet.circle.com (20 USDC per address per chain, every 2 hours)
3. Testnet native tokens for gas (ETH on Sepolia/Base Sepolia, AVAX on Fuji)
4. Node.js installed with the `viem` and `dotenv` packages

## How To Use This Skill

### Step 1: Setup the Project

Run the setup script to initialize the project with all dependencies:

```bash
cd /path/to/nexwave-gateway && bash setup.sh
```

This creates a `gateway-app/` directory with all necessary files pre-configured.

### Step 2: Check Gateway Info and Your Balance

```bash
cd gateway-app && node check-balance.js
```

This queries the Gateway API for supported chains and shows your unified USDC balance across all chains.

### Step 3: Deposit USDC into Gateway

```bash
node deposit.js
```

This deposits USDC into the Gateway Wallet contract on Ethereum Sepolia and Avalanche Fuji. After deposit and chain finality, your unified balance is credited. Avalanche finalizes instantly; Ethereum may take up to 20 minutes.

### Step 4: Transfer USDC Crosschain Instantly

```bash
node transfer.js
```

This creates burn intents, signs them with your private key, submits them to the Gateway API for attestation, and mints USDC on Base Sepolia. The attestation response typically arrives in <500ms.

## Key Concepts

**Unified Balance:** After depositing USDC into Gateway on any chain, the Gateway system credits your address with a unified balance. This balance is not locked to any specific chain — it can be accessed on any supported chain.

**Burn Intent:** To withdraw from your unified balance to a specific chain, you sign a "burn intent" — an EIP-712 typed data structure specifying the source chain, destination chain, amount, and recipient. Gateway verifies your balance is sufficient and returns a signed attestation.

**Attestation:** The Gateway API's signed proof that authorizes minting on the destination chain. You submit this attestation to the Gateway Minter contract on the destination chain to receive USDC.

**Fees:** 0.5 basis points (0.005%) during the early access period (through June 30, 2026). Plus base gas fees for on-chain transactions.

## Flow Diagram

```
Agent deposits USDC on Chain A
        │
        ▼
Gateway Wallet Contract (approve + deposit)
        │
        ▼
Wait for chain finality → Unified balance credited
        │
        ▼
Agent signs burn intent (EIP-712)
        │
        ▼
Submit to Gateway API ──► Attestation returned (<500ms)
        │
        ▼
Submit attestation to Gateway Minter on Chain B
        │
        ▼
USDC minted on Chain B for recipient
```

## Agent Use Cases

- **Multi-chain arbitrage:** Access USDC on any chain instantly to capture price differences
- **Cross-chain payments:** Pay for services on any chain from a single balance
- **Treasury management:** Consolidate USDC from multiple chains into one balance
- **Agent-to-agent commerce:** Accept payment on one chain, spend on another without delays
- **Capital efficiency:** No need to pre-position USDC across chains

## Troubleshooting

- **"Insufficient balance"**: Wait for chain finality after depositing. Ethereum takes ~20 min, Avalanche is instant.
- **"Gateway deposit not yet picked up"**: The Gateway API waits for block confirmations. Be patient on Ethereum.
- **Gas errors**: Ensure you have testnet native tokens (ETH/AVAX) for gas fees. Use chain-specific faucets.
- **Faucet limits**: You can get 20 USDC per address per chain every 2 hours from faucet.circle.com.

## References

- Circle Gateway Docs: https://developers.circle.com/gateway
- Gateway Quickstart: https://developers.circle.com/gateway/quickstarts/unified-balance-evm
- Full Quickstart Code: https://github.com/circlefin/evm-gateway-contracts/tree/master/quickstart
- Circle Faucet: https://faucet.circle.com
- Gateway API Reference: https://gateway-api-testnet.circle.com/v1/info
