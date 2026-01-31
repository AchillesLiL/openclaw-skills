---
name: weex-trading
description: WEEX Futures exchange integration for USDT-M perpetual futures trading. Place orders, manage positions, check account balances, and monitor market data on WEEX. Use when: (1) trading crypto futures on WEEX, (2) checking WEEX account balance or positions, (3) placing/canceling futures orders, (4) getting market prices or order book data, (5) managing leverage or margin settings.
---

# WEEX Futures Trading

USDT-margined perpetual futures trading on WEEX exchange. Up to 125x leverage.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `WEEX_API_KEY` | API Key from WEEX | Yes |
| `WEEX_API_SECRET` | API Secret | Yes |
| `WEEX_PASSPHRASE` | API Passphrase | Yes |
| `WEEX_BASE_URL` | API base URL | No (default: https://api-contract.weex.com) |

## Authentication

```bash
API_KEY="${WEEX_API_KEY}"
SECRET="${WEEX_API_SECRET}"
PASSPHRASE="${WEEX_PASSPHRASE}"
BASE_URL="${WEEX_BASE_URL:-https://api-contract.weex.com}"

TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")

# Generate signature
generate_signature() {
  local method="$1"
  local path="$2"
  local body="$3"
  local message="${TIMESTAMP}${method}${path}${body}"
  echo -n "$message" | openssl dgst -sha256 -hmac "$SECRET" -binary | base64
}
```

## Get Server Time (No Auth)

```bash
curl -s "${BASE_URL}/capi/v2/market/time" | jq '.'
```

## Get Account Assets

```bash
PATH_URL="/capi/v2/account/assets"
SIGNATURE=$(generate_signature "GET" "$PATH_URL" "")

curl -s "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" | jq '.data[] | {coin: .coinName, available: .available, frozen: .frozen, equity: .equity, unrealizedPnl: .unrealizePnl}'
```

## Get Ticker Price

```bash
SYMBOL="cmt_btcusdt"

curl -s "${BASE_URL}/capi/v2/market/ticker?symbol=${SYMBOL}" | jq '.data | {symbol: .symbol, last: .last, high: .high_24h, low: .low_24h, volume: .volume_24h, markPrice: .markPrice}'
```

## Get Order Book

```bash
SYMBOL="cmt_btcusdt"

curl -s "${BASE_URL}/capi/v2/market/depth?symbol=${SYMBOL}&limit=15" | jq '.data | {asks: .asks[:5], bids: .bids[:5]}'
```

## Get All Positions

```bash
PATH_URL="/capi/v2/account/position/allPosition"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "GET" "$PATH_URL" "")

curl -s "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" | jq '.data[] | select(.size != "0") | {symbol: .symbol, side: .side, size: .size, leverage: .leverage, unrealizedPnl: .unrealizePnl, entryPrice: .avg_cost}'
```

## Place Order

```bash
SYMBOL="cmt_btcusdt"
SIZE="10"              # Quantity in contracts
TYPE="1"               # 1=Open Long, 2=Open Short, 3=Close Long, 4=Close Short
ORDER_TYPE="0"         # 0=Normal, 1=Post-only, 2=FOK, 3=IOC
MATCH_PRICE="1"        # 0=Limit, 1=Market
PRICE="0"              # Price (ignored for market orders)
CLIENT_OID="order_$(date +%s)"

PATH_URL="/capi/v2/order/placeOrder"
BODY="{\"symbol\":\"${SYMBOL}\",\"client_oid\":\"${CLIENT_OID}\",\"size\":\"${SIZE}\",\"type\":\"${TYPE}\",\"order_type\":\"${ORDER_TYPE}\",\"match_price\":\"${MATCH_PRICE}\",\"price\":\"${PRICE}\"}"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "POST" "$PATH_URL" "$BODY")

curl -s -X POST "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq '.'
```

## Place Limit Order

```bash
SYMBOL="cmt_btcusdt"
SIZE="10"
TYPE="1"               # 1=Open Long
PRICE="90000"          # Limit price
CLIENT_OID="limit_$(date +%s)"

PATH_URL="/capi/v2/order/placeOrder"
BODY="{\"symbol\":\"${SYMBOL}\",\"client_oid\":\"${CLIENT_OID}\",\"size\":\"${SIZE}\",\"type\":\"${TYPE}\",\"order_type\":\"0\",\"match_price\":\"0\",\"price\":\"${PRICE}\"}"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "POST" "$PATH_URL" "$BODY")

curl -s -X POST "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq '.'
```

## Get Open Orders

```bash
PATH_URL="/capi/v2/order/current"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "GET" "$PATH_URL" "")

curl -s "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" | jq '.data[] | {orderId: .order_id, symbol: .symbol, side: .type, price: .price, size: .size, status: .status}'
```

## Cancel Order

```bash
ORDER_ID="1234567890"

PATH_URL="/capi/v2/order/cancel_order"
BODY="{\"orderId\":\"${ORDER_ID}\"}"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "POST" "$PATH_URL" "$BODY")

curl -s -X POST "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq '.'
```

## Close All Positions

```bash
PATH_URL="/capi/v2/order/closePositions"
BODY="{}"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "POST" "$PATH_URL" "$BODY")

curl -s -X POST "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq '.'
```

## Change Leverage

```bash
SYMBOL="cmt_btcusdt"
LEVERAGE="20"
MARGIN_MODE="1"        # 1=Cross, 3=Isolated

PATH_URL="/capi/v2/account/leverage"
BODY="{\"symbol\":\"${SYMBOL}\",\"marginMode\":${MARGIN_MODE},\"longLeverage\":\"${LEVERAGE}\",\"shortLeverage\":\"${LEVERAGE}\"}"
TIMESTAMP=$(python3 -c "import time; print(int(time.time() * 1000))")
SIGNATURE=$(generate_signature "POST" "$PATH_URL" "$BODY")

curl -s -X POST "${BASE_URL}${PATH_URL}" \
  -H "ACCESS-KEY: ${API_KEY}" \
  -H "ACCESS-SIGN: ${SIGNATURE}" \
  -H "ACCESS-PASSPHRASE: ${PASSPHRASE}" \
  -H "ACCESS-TIMESTAMP: ${TIMESTAMP}" \
  -H "Content-Type: application/json" \
  -d "$BODY" | jq '.'
```

## Get Funding Rate

```bash
SYMBOL="cmt_btcusdt"

curl -s "${BASE_URL}/capi/v2/market/currentFundRate?symbol=${SYMBOL}" | jq '.data[] | {symbol: .symbol, rate: .fundingRate, nextSettlement: .timestamp}'
```

## Order Types Reference

| Type | Description |
|------|-------------|
| `1` | Open Long (buy to open) |
| `2` | Open Short (sell to open) |
| `3` | Close Long (sell to close) |
| `4` | Close Short (buy to close) |

| order_type | Description |
|------------|-------------|
| `0` | Normal order |
| `1` | Post-only (maker only) |
| `2` | FOK (fill or kill) |
| `3` | IOC (immediate or cancel) |

| match_price | Description |
|-------------|-------------|
| `0` | Limit order |
| `1` | Market order |

| marginMode | Description |
|------------|-------------|
| `1` | Cross margin |
| `3` | Isolated margin |

## Popular Trading Pairs

| Pair | Description |
|------|-------------|
| cmt_btcusdt | Bitcoin / USDT |
| cmt_ethusdt | Ethereum / USDT |
| cmt_solusdt | Solana / USDT |
| cmt_xrpusdt | XRP / USDT |
| cmt_dogeusdt | Dogecoin / USDT |
| cmt_bnbusdt | BNB / USDT |

## Safety Rules

1. **ALWAYS** display order details before execution
2. **VERIFY** trading pair and quantity
3. **CHECK** account balance before trading
4. **WARN** about leverage risks (up to 125x)
5. **NEVER** execute without user confirmation
6. **CONFIRM** position closure before executing

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `40001` | Invalid parameter | Check parameter format |
| `40101` | Invalid API key/signature | Verify credentials and timestamp |
| `40301` | IP not whitelisted | Add IP to whitelist |
| `42901` | Rate limit exceeded | Reduce request frequency |
| `50001` | Internal error | Retry after delay |

## Rate Limits

| Category | IP Limit | UID Limit |
|----------|----------|-----------|
| Market Data | 20 req/sec | N/A |
| Account Info | 10 req/sec | 10 req/sec |
| Order Placement | 10 req/sec | 10 req/sec |

## Links

- [WEEX](https://www.weex.com)
- Base URL: `https://api-contract.weex.com`
