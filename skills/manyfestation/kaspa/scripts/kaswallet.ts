#!/usr/bin/env npx ts-node --esm
/**
 * Kaspa Wallet CLI - Simplified for LLM agents
 * Usage: ./kaswallet.sh <command> [args...]
 */

import * as kaspa from '@kasdk/nodejs';

// ============================================================================
// Config from environment
// ============================================================================

const NETWORK = process.env.KASPA_NETWORK || 'mainnet';
const MNEMONIC = process.env.KASPA_MNEMONIC;
const PRIVATE_KEY = process.env.KASPA_PRIVATE_KEY;

// ============================================================================
// Helpers
// ============================================================================

const json = (data: any) => console.log(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2));
const sompiToKas = (s: bigint | number | string) => (Number(BigInt(s)) / 1e8).toFixed(8).replace(/\.?0+$/, '');
const kasToSompi = (k: string | number) => BigInt(Math.round(parseFloat(String(k)) * 1e8));

async function init() {
  if (typeof (globalThis as any).WebSocket === 'undefined') {
    const ws = await import('websocket');
    (globalThis as any).WebSocket = ws.w3cwebsocket;
  }
  kaspa.initConsolePanicHook();
}

async function rpc(): Promise<kaspa.RpcClient> {
  await init();
  const client = new kaspa.RpcClient({ resolver: new kaspa.Resolver(), networkId: NETWORK });
  await client.connect();
  return client;
}

function wallet(): { key: kaspa.PrivateKey; addr: kaspa.Address } {
  if (!MNEMONIC && !PRIVATE_KEY) throw new Error('Set KASPA_MNEMONIC or KASPA_PRIVATE_KEY');
  let key: kaspa.PrivateKey;
  if (MNEMONIC) {
    const m = new kaspa.Mnemonic(MNEMONIC);
    const x = new kaspa.XPrv(m.toSeed());
    key = new kaspa.PrivateKeyGenerator(x, false, 0n).receiveKey(0);
  } else {
    key = new kaspa.PrivateKey(PRIVATE_KEY!);
  }
  return { key, addr: key.toPublicKey().toAddress(NETWORK) };
}

// ============================================================================
// Commands
// ============================================================================

// balance <address?>
async function cmdBalance(address?: string) {
  const addr = address || (MNEMONIC || PRIVATE_KEY ? wallet().addr.toString() : null);
  if (!addr) throw new Error('Provide address or set KASPA_MNEMONIC');
  const c = await rpc();
  try {
    const r = await c.getBalanceByAddress({ address: addr });
    json({ address: addr, balance: sompiToKas(r.balance), sompi: r.balance.toString(), network: NETWORK });
  } finally { await c.disconnect(); }
}

// info
async function cmdInfo() {
  const c = await rpc();
  try {
    const dag = await c.getBlockDagInfo();
    const srv = await c.getServerInfo();
    json({ network: NETWORK, url: c.url, blocks: dag.blockCount, synced: srv.isSynced, version: srv.serverVersion });
  } finally { await c.disconnect(); }
}

// send <to> <amount|max> [priorityFee]
async function cmdSend(to: string, amountArg: string, priorityFeeArg?: string) {
  if (!to) throw new Error('Usage: send <to> <amount|max> [priorityFee]');

  const { key, addr } = wallet();
  const c = await rpc();

  try {
    const bal = BigInt((await c.getBalanceByAddress({ address: addr.toString() })).balance);
    const utxos = (await c.getUtxosByAddresses({ addresses: [addr.toString()] })).entries || [];
    if (!utxos.length) throw new Error('No UTXOs');

    const priorityFee = priorityFeeArg ? kasToSompi(priorityFeeArg) : 0n;
    const FEE_BUFFER = 30000n + priorityFee; // base 0.0003 KAS + priority
    const MIN_CHANGE = 20000000n; // 0.2 KAS

    // Calculate amount
    let amount = amountArg === 'max' ? bal - FEE_BUFFER : kasToSompi(amountArg);
    if (amount <= 0n) throw new Error(`Insufficient balance: ${sompiToKas(bal)} KAS`);

    // Auto-adjust for storage mass (change < 0.2 KAS)
    const change = bal - amount - FEE_BUFFER;
    if (change > 0n && change < MIN_CHANGE) {
      amount = bal - FEE_BUFFER; // send all to avoid dust
    }

    // Build & send
    const result = await kaspa.createTransactions({
      entries: utxos,
      outputs: [new kaspa.PaymentOutput(new kaspa.Address(to), amount)],
      changeAddress: addr,
      priorityFee,
      networkId: NETWORK,
    });

    const txIds: string[] = [];
    for (const tx of result.transactions) {
      tx.sign([key]);
      txIds.push(await tx.submit(c));
    }

    json({
      status: 'sent',
      txid: txIds[0],
      from: addr.toString(),
      to,
      amount: sompiToKas(amount),
      fee: sompiToKas(result.summary.fees),
    });
  } finally { await c.disconnect(); }
}

// uri <address?> <amount?> <message?>
async function cmdUri(address?: string, amount?: string, message?: string) {
  const addr = address || (MNEMONIC || PRIVATE_KEY ? wallet().addr.toString() : null);
  if (!addr) throw new Error('Provide address or set KASPA_MNEMONIC');
  const params = new URLSearchParams();
  if (amount) params.set('amount', amount);
  if (message) params.set('message', message);
  json({ uri: `kaspa:${addr}${params.toString() ? '?' + params : ''}` });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    switch (cmd) {
      case 'balance': await cmdBalance(args[0]); break;
      case 'info': await cmdInfo(); break;
      case 'send': await cmdSend(args[0], args[1], args[2]); break;
      case 'uri': await cmdUri(args[0], args[1], args[2]); break;
      default:
        console.log(`Kaspa Wallet CLI

Commands:
  balance [address]              Check balance (uses wallet if no address)
  info                           Network info
  send <to> <amount|max> [fee]   Send KAS (fee in KAS, optional)
  uri [address] [amount] [msg]   Generate payment URI

Environment:
  KASPA_MNEMONIC      Wallet seed phrase
  KASPA_PRIVATE_KEY   Or private key hex
  KASPA_NETWORK       mainnet (default), testnet-10`);
    }
  } catch (e: any) {
    json({ error: e.message || String(e) });
    process.exit(1);
  }
}

main();
