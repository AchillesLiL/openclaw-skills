# WEEX Futures Trading Skill

A Claude Code skill for trading USDT-margined perpetual futures on [WEEX](https://www.weex.com) exchange with up to 125x leverage.

## Features

- **Market Data** - Real-time ticker, order book, trades, candlesticks, funding rates
- **Account Management** - Check balances, positions, leverage settings
- **Order Operations** - Place market/limit orders, cancel orders, close positions
- **Position Management** - Open long/short, close positions, adjust margin
- **Python CLI Client** - Command-line tool for quick API interactions

## Installation

### As Claude Code Skill

Download the latest `.skill` file from [Releases](https://github.com/bowen31337/weex-futures-trading-skill/releases) and add it to your skills directory:

```bash
# Download latest release
curl -L -o weex-trading.skill \
  https://github.com/bowen31337/weex-futures-trading-skill/releases/latest/download/weex-trading-v1.0.0.skill

# Install to Claude Code skills directory
mv weex-trading.skill ~/.claude/skills/
```

### As Standalone Python Client

```bash
git clone https://github.com/bowen31337/weex-futures-trading-skill.git
cd weex-futures-trading-skill
pip install requests
```

## Configuration

Set your WEEX API credentials as environment variables:

```bash
export WEEX_API_KEY=your_api_key
export WEEX_API_SECRET=your_api_secret
export WEEX_PASSPHRASE=your_passphrase
export WEEX_BASE_URL=https://api-contract.weex.com  # Optional
```

### Getting API Keys

1. Log in to your WEEX account at [weex.com](https://www.weex.com)
2. Navigate to **API Management** in account settings
3. Create a new API key with required permissions:
   - **Read** - View account info, positions, order history
   - **Trade** - Place and cancel orders
4. Save your **API Key**, **API Secret**, and **Passphrase** securely

## Usage

### Python CLI Client

```bash
# Market Data (no authentication required)
python scripts/weex_client.py time                    # Server time
python scripts/weex_client.py ticker cmt_btcusdt      # Get BTC price
python scripts/weex_client.py depth cmt_btcusdt       # Order book
python scripts/weex_client.py funding cmt_btcusdt     # Funding rate

# Account Info (authentication required)
python scripts/weex_client.py assets                  # Account balances
python scripts/weex_client.py positions               # All positions
python scripts/weex_client.py orders                  # Open orders
python scripts/weex_client.py settings                # Leverage settings

# Trading
python scripts/weex_client.py buy cmt_btcusdt 10              # Market buy 10 contracts
python scripts/weex_client.py buy cmt_btcusdt 10 95000        # Limit buy at $95,000
python scripts/weex_client.py sell cmt_btcusdt 10             # Market short 10 contracts
python scripts/weex_client.py close_long cmt_btcusdt 10       # Close long position
python scripts/weex_client.py close_short cmt_btcusdt 10      # Close short position

# Order Management
python scripts/weex_client.py cancel 1234567890       # Cancel order by ID
python scripts/weex_client.py cancel_all              # Cancel all orders
python scripts/weex_client.py close_all               # Close all positions

# Account Settings
python scripts/weex_client.py leverage cmt_btcusdt 20 # Set 20x leverage
```

### With Claude Code

Once installed as a skill, Claude can help you trade on WEEX:

```
You: What's the current BTC price on WEEX?
Claude: [Fetches ticker data and displays price]

You: Open a long position on BTC with 10 contracts
Claude: [Confirms order details and executes after your approval]

You: Show my current positions
Claude: [Displays all open positions with PnL]
```

## API Reference

### Order Types

| Type | Description |
|------|-------------|
| `1` | Open Long (buy to open) |
| `2` | Open Short (sell to open) |
| `3` | Close Long (sell to close) |
| `4` | Close Short (buy to close) |

### Execution Types

| Type | Description |
|------|-------------|
| `0` | Normal order |
| `1` | Post-only (maker only) |
| `2` | FOK (fill or kill) |
| `3` | IOC (immediate or cancel) |

### Margin Modes

| Mode | Description |
|------|-------------|
| `1` | Cross margin |
| `3` | Isolated margin |

### Popular Trading Pairs

| Symbol | Description |
|--------|-------------|
| `cmt_btcusdt` | Bitcoin / USDT |
| `cmt_ethusdt` | Ethereum / USDT |
| `cmt_solusdt` | Solana / USDT |
| `cmt_xrpusdt` | XRP / USDT |
| `cmt_dogeusdt` | Dogecoin / USDT |

## Rate Limits

| Category | IP Limit | UID Limit |
|----------|----------|-----------|
| Market Data | 20 req/sec | N/A |
| Account Info | 10 req/sec | 10 req/sec |
| Order Operations | 10 req/sec | 10 req/sec |

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| `40001` | Invalid parameter | Check parameter format |
| `40101` | Authentication failed | Verify credentials and timestamp |
| `40301` | IP not whitelisted | Add IP to API whitelist |
| `42901` | Rate limit exceeded | Reduce request frequency |

## Safety Notes

- **Always verify** order details before confirming trades
- **Check balance** before placing orders
- **Understand leverage risks** - higher leverage = higher risk
- **Use stop-loss orders** to manage risk
- **Start with small positions** when testing

## Project Structure

```
weex-trading/
├── SKILL.md                 # Claude Code skill definition
├── README.md                # This file
├── scripts/
│   └── weex_client.py       # Python CLI client
└── references/
    └── api_reference.md     # API endpoint reference
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- [WEEX Exchange](https://www.weex.com)
- [WEEX API Documentation](https://www.weex.com/help)
- [Releases](https://github.com/bowen31337/weex-futures-trading-skill/releases)
