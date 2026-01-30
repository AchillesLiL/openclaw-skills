---
name: qr-auction-bidder
description: Bid on $QR auctions at qrcoin.fun. Place bids on Base mainnet using USDC.
metadata:
  openclaw:
    emoji: "🎯"
    requires: []
---

# QR Auction Bidder

Bid on $QR daily auctions. Each auction lets you bid with USDC to win a QR code that points to your chosen URL for 24 hours.

## Overview

$QR runs continuous 24-hour auctions on Base mainnet. The highest bid wins, and the winning URL is displayed on a real QR code. Losing bidders are refunded automatically.

- **Website**: https://qrcoin.fun
- **Network**: Base mainnet (chain ID 8453)
- **Currency**: USDC (6 decimals)
- **Community**: m/qr on moltbook.com

## Contract Addresses

| Contract | Address |
|----------|---------|
| QRAuctionV5 | `0x7309779122069EFa06ef71a45AE0DB55A259A176` |
| USDC (Base) | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |

## Minimum Bids

| Action | Minimum |
|--------|---------|
| Create new bid (`createBid`) | 11.11 USDC |
| Contribute to existing bid (`contributeToBid`) | 1.00 USDC |

## How Auctions Work

1. A new auction starts automatically after the previous one settles
2. Each auction has a `tokenId`, `startTime`, and `endTime` (typically 24 hours)
3. Bidders call `createBid()` to bid on a URL, or `contributeToBid()` to add USDC to an existing URL's bid
4. The highest total bid when time expires wins
5. If a new highest bid arrives in the last 5 minutes, the auction extends (up to 3 hours max)
6. After the auction ends, it's settled and losing bidders are refunded

## Bidding with viem

### Setup

```typescript
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const AUCTION_ADDRESS = "0x7309779122069EFa06ef71a45AE0DB55A259A176";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const publicClient = createPublicClient({
  chain: base,
  transport: http("https://mainnet.base.org"),
});

// WARNING: Never hardcode private keys. Use environment variables or secure key management.
const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);

const walletClient = createWalletClient({
  account,
  chain: base,
  transport: http("https://mainnet.base.org"),
});
```

### Check Auction Status

```typescript
const auctionAbi = parseAbi([
  "function auction() view returns (uint256 tokenId, (uint256 totalAmount, string urlString, (address contributor, uint256 amount, uint256 timestamp)[] contributions) highestBid, uint256 startTime, uint256 endTime, bool settled, (uint256 validUntil, string urlString) qrMetadata)",
  "function getBidCount() view returns (uint256)",
  "function getAllBids() view returns ((uint256 totalAmount, string urlString, (address contributor, uint256 amount, uint256 timestamp)[] contributions)[])",
  "function getBid(string _urlString) view returns ((uint256 totalAmount, string urlString, (address contributor, uint256 amount, uint256 timestamp)[] contributions))",
]);

// Get current auction state
const auction = await publicClient.readContract({
  address: AUCTION_ADDRESS,
  abi: auctionAbi,
  functionName: "auction",
});

const tokenId = auction[0];        // Current token ID
const highestBid = auction[1];     // { totalAmount, urlString, contributions[] }
const startTime = auction[2];      // Unix timestamp
const endTime = auction[3];        // Unix timestamp
const settled = auction[4];        // boolean

const now = BigInt(Math.floor(Date.now() / 1000));
const isActive = now < endTime && !settled;
const timeRemaining = isActive ? Number(endTime - now) : 0;

console.log(`Auction #${tokenId}`);
console.log(`Active: ${isActive}`);
console.log(`Time remaining: ${Math.floor(timeRemaining / 60)} minutes`);
console.log(`Highest bid: ${Number(highestBid.totalAmount) / 1e6} USDC`);
console.log(`Leading URL: ${highestBid.urlString}`);
```

### Approve USDC Spending

Before bidding, approve the auction contract to spend your USDC:

```typescript
const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
]);

// Check existing allowance
const allowance = await publicClient.readContract({
  address: USDC_ADDRESS,
  abi: erc20Abi,
  functionName: "allowance",
  args: [account.address, AUCTION_ADDRESS],
});

const bidAmount = 12_000_000n; // 12.00 USDC (6 decimals)

if (allowance < bidAmount) {
  const hash = await walletClient.writeContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: "approve",
    args: [AUCTION_ADDRESS, bidAmount],
  });
  await publicClient.waitForTransactionReceipt({ hash });
}
```

### Create a New Bid

Use `createBid` when no bid exists yet for your URL:

```typescript
const bidAbi = parseAbi([
  "function createBid(uint256 _tokenId, string _urlString, string _name)",
]);

const hash = await walletClient.writeContract({
  address: AUCTION_ADDRESS,
  abi: bidAbi,
  functionName: "createBid",
  args: [
    tokenId,                    // Current auction token ID
    "https://your-url.com",     // URL you're bidding for
    "YourName",                 // Display name for the bid
  ],
});

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(`Bid placed! tx: ${receipt.transactionHash}`);
```

The contract transfers your full USDC allowance (or balance, whichever is lower) as the bid amount. Set your approval to exactly the amount you want to bid.

### Contribute to an Existing Bid

Use `contributeToBid` to add USDC to a URL that already has a bid:

```typescript
const contributeAbi = parseAbi([
  "function contributeToBid(uint256 _tokenId, string _urlString, string _name)",
]);

const hash = await walletClient.writeContract({
  address: AUCTION_ADDRESS,
  abi: contributeAbi,
  functionName: "contributeToBid",
  args: [
    tokenId,                    // Current auction token ID
    "https://existing-url.com", // URL with an existing bid
    "YourName",                 // Display name
  ],
});
```

### Decide: createBid vs contributeToBid

```typescript
// Check if a URL already has a bid
try {
  const existingBid = await publicClient.readContract({
    address: AUCTION_ADDRESS,
    abi: auctionAbi,
    functionName: "getBid",
    args: ["https://your-url.com"],
  });

  if (existingBid.totalAmount > 0n) {
    // URL already has a bid — use contributeToBid
  } else {
    // No bid for this URL — use createBid
  }
} catch {
  // getBid reverts if not found — use createBid
}
```

## Auction Timing

| Parameter | Value |
|-----------|-------|
| Duration | 24 hours |
| Time buffer | 5 minutes (bids in last 5 min extend the auction) |
| Max extension | 3 hours beyond scheduled end |

## Important Notes

- **USDC is real money.** Bids use real USDC on Base mainnet. Only bid what you can afford to lose.
- **Losing bids are refunded** after the auction settles, but there may be a delay during batch processing.
- **The contract takes your full allowance** (up to your balance). Set your USDC approval to exactly your intended bid amount.
- **URL must be unique per auction.** If someone already bid on your URL, use `contributeToBid`. Calling `createBid` with a taken URL will revert with `URL_ALREADY_HAS_BID`.
- **Token ID must match.** Always read the current `tokenId` from `auction()` before bidding. Using a wrong token ID reverts with `INVALID_TOKEN_ID`.

## ABI Reference

The full QRAuctionV5 ABI is available at `references/QRAuctionV5.abi.json` in this skill package.

Key functions:

| Function | Description |
|----------|-------------|
| `auction()` | Get current auction state |
| `getAllBids()` | Get all bids for current auction |
| `getBid(url)` | Get bid for a specific URL |
| `getBidCount()` | Number of bids in current auction |
| `createBid(tokenId, url, name)` | Place a new bid for a URL |
| `contributeToBid(tokenId, url, name)` | Add to an existing URL's bid |
| `settings()` | Get contract config (reserves, timing) |

Key events:

| Event | Description |
|-------|-------------|
| `AuctionBid` | New bid created |
| `BidContributionMade` | Contribution added to existing bid |
| `AuctionSettled` | Auction ended, winner determined |
| `AuctionCreated` | New auction started |
