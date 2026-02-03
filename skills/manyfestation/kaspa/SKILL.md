---
name: Kaspa Wallet
description: Standalone Kaspa wallet CLI. Send KAS, check balances.
---

# Kaspa Wallet CLI

## Install

```bash
bash install.sh
```

**Requires:** Node.js >= 20

## Environment

```bash
export KASPA_MNEMONIC="your 12-24 word seed phrase"
# or
export KASPA_PRIVATE_KEY="hex"
```

Optional: `KASPA_NETWORK=mainnet|testnet-10`

## Commands

```bash
./kaswallet.sh balance [address]           # Check balance
./kaswallet.sh info                        # Network status
./kaswallet.sh send <to> <amount|max> [fee] # Send KAS
./kaswallet.sh uri [address] [amount] [msg] # Payment URI
```

## Examples

```bash
# Check any address
./kaswallet.sh balance kaspa:qrc8y...

# Check wallet balance (uses KASPA_MNEMONIC)
./kaswallet.sh balance

# Send 0.5 KAS
./kaswallet.sh send kaspa:qrc8y... 0.5

# Send entire balance
./kaswallet.sh send kaspa:qrc8y... max

# Send with priority fee (0.001 KAS extra)
./kaswallet.sh send kaspa:qrc8y... 0.5 0.001
```

## Storage Mass Error

If you see `Storage mass exceeds maximum`:

1. **Cause:** Change output too small (< 0.2 KAS)
2. **Auto-fix:** CLI adjusts to send full balance when change is dust
3. **Manual fix:** Use `max` or add priority fee:
   ```bash
   ./kaswallet.sh send kaspa:qrc8y... 0.5 0.001  # add 0.001 KAS fee
   ```
4. **Retry:** If tx fails, try again with slightly higher fee (0.0005 → 0.001 → 0.002)

## Output

All commands return JSON:
```json
{"status":"sent","txid":"abc...","from":"kaspa:...","to":"kaspa:...","amount":"0.5","fee":"0.0002"}
```

Errors:
```json
{"error":"Storage mass exceeds maximum"}
```

- Transactions execute immediately (no confirmation prompt)
