import { account, ethereum, base, avalanche } from "./setup-gateway.js";
import { GatewayClient } from "./gateway-client.js";
import { burnIntent, burnIntentTypedData } from "./typed-data.js";

///////////////////////////////////////////////////////////////////////////////
// Transfer USDC from Unified Balance to Base Sepolia
// This script demonstrates the full Gateway crosschain transfer flow:
// 1. Check unified balance across chains
// 2. Construct burn intents (source chain + amount)
// 3. Sign burn intents with EIP-712
// 4. Submit to Gateway API → receive attestation (<500ms)
// 5. Mint USDC on destination chain (Base Sepolia)

const gatewayClient = new GatewayClient();

console.log("═══════════════════════════════════════════════");
console.log("  Nexwave Gateway — Crosschain Transfer");
console.log("═══════════════════════════════════════════════");
console.log(`Account: ${account.address}\n`);

// Step 1: Check supported chains
console.log("📡 Fetching Gateway API info...");
const info = await gatewayClient.info();
for (const domain of info.domains) {
  console.log(
    `   • ${domain.chain} ${domain.network}`,
    `(wallet: ${"walletContract" in domain}, minter: ${"minterContract" in domain})`
  );
}

// Step 2: Check balances
console.log("\n💰 Checking unified USDC balance...");
const { balances } = await gatewayClient.balances("USDC", account.address);
for (const balance of balances) {
  const chainName = GatewayClient.CHAINS[balance.domain] || `Domain ${balance.domain}`;
  console.log(`   • ${chainName}: ${balance.balance} USDC`);
}

// Amounts to transfer from each source chain
const fromEthereumAmount = 2;
const fromAvalancheAmount = 3;

// Verify balances are sufficient
const avalancheBalance = balances.find(
  (b) => b.domain === GatewayClient.DOMAINS.avalanche
)?.balance;
if (!avalancheBalance || parseFloat(avalancheBalance) < fromAvalancheAmount) {
  console.error("\n❌ Avalanche balance insufficient. Wait for deposit finality.");
  process.exit(1);
}
console.log("\n   ✅ Avalanche deposit confirmed");

const ethereumBalance = balances.find(
  (b) => b.domain === GatewayClient.DOMAINS.ethereum
)?.balance;
if (!ethereumBalance || parseFloat(ethereumBalance) < fromEthereumAmount) {
  console.error("\n❌ Ethereum balance insufficient. Ethereum takes ~20 min to finalize.");
  process.exit(1);
}
console.log("   ✅ Ethereum deposit confirmed");

// Step 3: Construct burn intents
console.log("\n🔥 Constructing burn intents...");
console.log(`   • ${fromEthereumAmount} USDC from Ethereum → Base`);
console.log(`   • ${fromAvalancheAmount} USDC from Avalanche → Base`);

const burnIntents = [
  burnIntent({
    account,
    from: ethereum,
    to: base,
    amount: fromEthereumAmount,
    recipient: account.address,
  }),
  burnIntent({
    account,
    from: avalanche,
    to: base,
    amount: fromAvalancheAmount,
    recipient: account.address,
  }),
];

// Step 4: Sign burn intents (EIP-712)
console.log("\n🔐 Signing burn intents...");
const request = await Promise.all(
  burnIntents.map(async (intent) => {
    const typedData = burnIntentTypedData(intent);
    const signature = await account.signTypedData(typedData);
    return { burnIntent: typedData.message, signature };
  })
);
console.log("   ✅ Burn intents signed");

// Step 5: Submit to Gateway API for attestation
console.log("\n📤 Requesting attestation from Gateway API...");
const start = performance.now();
const response = await gatewayClient.transfer(request);
const elapsed = performance.now() - start;

if (response.success === false) {
  console.error(`\n❌ Gateway API error: ${response.message}`);
  process.exit(1);
}

console.log(`   ✅ Attestation received in ${elapsed.toFixed(2)}ms`);
console.log(`   ⚡ That's ${elapsed < 500 ? "under" : "over"} 500ms!`);

// Step 6: Mint USDC on Base Sepolia
console.log("\n🪙 Minting USDC on Base Sepolia...");
const { attestation, signature } = response;
const mintTx = await base.gatewayMinter.write.gatewayMint([
  attestation,
  signature,
]);
await base.client.waitForTransactionReceipt({ hash: mintTx });

console.log(`   ✅ Minted! Transaction: ${mintTx}`);
console.log(`   🔗 Explorer: https://sepolia.basescan.org/tx/${mintTx}`);

console.log("\n═══════════════════════════════════════════════");
console.log(`✅ Successfully transferred ${fromEthereumAmount + fromAvalancheAmount} USDC to Base Sepolia!`);
console.log("   Source: Ethereum (2 USDC) + Avalanche (3 USDC)");
console.log("   Destination: Base Sepolia");
console.log(`   Attestation latency: ${elapsed.toFixed(2)}ms`);
console.log("═══════════════════════════════════════════════");

process.exit(0);
