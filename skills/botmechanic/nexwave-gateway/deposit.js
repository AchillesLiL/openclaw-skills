import { account, ethereum, base, avalanche } from "./setup-gateway.js";

///////////////////////////////////////////////////////////////////////////////
// Deposit USDC into Circle Gateway
// This script deposits USDC into the Gateway Wallet contract on each chain,
// creating a unified crosschain USDC balance.
//
// IMPORTANT: Do NOT use ERC-20 transfer() directly — that will lose funds.
// The correct flow is: approve() → deposit() on the Gateway Wallet contract.

const DEPOSIT_AMOUNT = 10_000000n; // 10 USDC (6 decimals)

console.log("═══════════════════════════════════════════════");
console.log("  Nexwave Gateway — Deposit USDC");
console.log("═══════════════════════════════════════════════");
console.log(`Account: ${account.address}`);
console.log(`Deposit amount: ${Number(DEPOSIT_AMOUNT) / 1e6} USDC per chain\n`);

for (const chain of [ethereum, avalanche]) {
  console.log(`\n🔗 ${chain.name} (Domain ${chain.domain})`);
  console.log("─".repeat(40));

  // Check USDC balance
  console.log("   Checking USDC balance...");
  const balance = await chain.usdc.read.balanceOf([account.address]);
  console.log(`   Balance: ${Number(balance) / 1e6} USDC`);

  if (balance < DEPOSIT_AMOUNT) {
    console.error(`   ❌ Insufficient USDC on ${chain.name}!`);
    console.error("   Please top up at https://faucet.circle.com");
    process.exit(1);
  }

  try {
    // Step 1: Approve Gateway Wallet to spend USDC
    console.log("   Approving Gateway Wallet for USDC...");
    const approvalTx = await chain.usdc.write.approve([
      chain.gatewayWallet.address,
      DEPOSIT_AMOUNT,
    ]);
    await chain.client.waitForTransactionReceipt({ hash: approvalTx });
    console.log(`   ✅ Approved — tx: ${approvalTx}`);

    // Step 2: Deposit USDC into Gateway Wallet
    console.log("   Depositing USDC into Gateway Wallet...");
    const depositTx = await chain.gatewayWallet.write.deposit([
      chain.usdc.address,
      DEPOSIT_AMOUNT,
    ]);
    await chain.client.waitForTransactionReceipt({ hash: depositTx });
    console.log(`   ✅ Deposited — tx: ${depositTx}`);

  } catch (error) {
    if (error.details && error.details.includes("insufficient funds")) {
      console.error(`   ❌ Not enough ${chain.currency} for gas on ${chain.name}!`);
      console.error("   Please top up using a testnet faucet.");
    } else {
      console.error("   ❌ Error:", error.message || error);
    }
    process.exit(1);
  }
}

console.log("\n═══════════════════════════════════════════════");
console.log("✅ Deposits complete!");
console.log("   Avalanche: finality is instant");
console.log("   Ethereum: wait ~20 min for finality");
console.log("   Then run: node check-balance.js");
console.log("═══════════════════════════════════════════════");

process.exit(0);
