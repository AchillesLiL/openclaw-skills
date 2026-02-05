---
name: nervepay
version: 1.0.0
description: Self-sovereign identity layer for AI agents. W3C DIDs, Ed25519 signatures, capabilities, reputation, and optional x402 payments.
homepage: https://nervepay.xyz
repository: https://github.com/nervepay/nervepay
license: MIT
author: NervePay
tags:
  - identity
  - authentication
  - agents
  - did
  - reputation
  - security
  - w3c
category: identity
keywords:
  - self-sovereign identity
  - agent authentication
  - cryptographic signatures
  - agent reputation
  - x402 payments
metadata:
  api_base: https://api.nervepay.xyz/v1
  requires_auth: false
  min_version: "1.0.0"
---

# NervePay — Agent Identity Layer

## Overview

NervePay provides self-sovereign identity for AI agents with:

- **W3C DIDs** — Verifiable agent identifiers (did:nervepay:agent:xxx)
- **Ed25519 Signatures** — Cryptographic authentication for agents
- **Capability-Based Permissions** — Spending limits and operation controls
- **Reputation Tracking** — Public trust scores based on transaction history
- **Optional x402 Payments** — Agent-to-agent payments on supported networks

Perfect for agents in OpenClaw, Moltbook, RentAHuman, or any platform needing verifiable agent identity.

> **CRITICAL: Private keys are shown ONCE**
>
> After registration (human-initiated or agent-initiated), the private key and recovery mnemonic are returned exactly once. Store them securely. If lost, use the recovery mnemonic to restore the private key.

## Installation & Setup

### For OpenClaw Agents

1. **Add NervePay to your agent configuration:**
   ```yaml
   skills:
     - name: nervepay
       version: "1.0.0"
   ```

2. **Register your agent with NervePay:**
   - Use the agent-first registration endpoint (no auth required)
   - Agent receives DID, private key, and mnemonic
   - Store credentials securely

3. **Start authenticating:**
   - Sign requests with Ed25519 private key
   - Include Agent-DID, Agent-Signature, Agent-Nonce headers
   - Your agent is now verifiable across platforms

### Requirements

- OpenClaw runtime
- Ability to sign Ed25519 signatures
- Secure key storage

---

## Key files

| File         | Purpose                                                                                   |
| ------------ | ----------------------------------------------------------------------------------------- |
| SKILL.md     | https://nervepay.xyz/skill.md — registration, authentication, verification, API reference |
| Identity     | Store your agent's keys securely (did, private_key, mnemonic)                            |

## Security

- **Private key**: Used to sign requests. Never send to any server; only send signatures.
- **DID**: Your agent's public identifier (e.g., `did:nervepay:agent:abc123`). Safe to share.
- **Nonces**: Single-use values prevent replay attacks. Generate a new nonce for each request.
- **Timestamps**: Must be within 5 minutes of server time.

## Two Registration Flows

### Flow 1: Dashboard Registration
Human creates agent in the NervePay dashboard. Credentials delivered instantly.

### Flow 2: Agent-First Registration
Agent bootstraps its own identity and receives a claim link. Human verifies ownership later — the agent stays autonomous until then.

---

## Quick Start: Agent-First Registration

### 1. Register (no auth required — agent bootstraps itself)

```bash
curl -X POST https://api.nervepay.xyz/v1/agent-identity/register-pending \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Weather Agent",
    "description": "Fetches weather data for users"
  }'
```

**Response (201):**

```json
{
  "did": "did:nervepay:agent:abc123xyz",
  "private_key": "ed25519:5Kd7...",
  "mnemonic": "word1 word2 word3 ... word24",
  "public_key": "ed25519:...",
  "session_id": "a1b2c3d4e5f6...",
  "claim_url": "https://nervepay.xyz/claim/a1b2c3d4e5f6...",
  "expires_at": "2026-02-05T12:00:00Z",
  "status": "pending"
}
```

> **CRITICAL**: Store `private_key` and `mnemonic` securely — they are shown only once!
> The agent can start authenticating immediately. Human claims ownership later via `claim_url`.

### 2. Start authenticating immediately

The agent now has everything needed to sign requests. Store the credentials securely and begin making authenticated API calls.

### 3. Human claims ownership (optional but recommended)

Tell the human owner to open the `claim_url` in their browser to establish accountability:
1. Human logs in or signs up on NervePay
2. Human claims the agent (links it to their account)
3. Agent now has verified human ownership (improves trust score)

### 4. Poll claim status (optional)

Agent can poll to check if human has claimed ownership:

```bash
curl "https://api.nervepay.xyz/v1/agent-identity/register-pending/SESSION_ID/status"
```

**Response:**

```json
{
  "did": "did:nervepay:agent:abc123xyz",
  "session_id": "a1b2c3d4e5f6...",
  "status": "claimed",
  "expires_at": "2026-02-05T12:00:00Z",
  "created_at": "2026-02-04T12:00:00Z",
  "claimed_at": "2026-02-04T12:05:00Z"
}
```

Status values: `pending` | `claimed` | `expired` | `revoked`

---

## Authenticating Requests

After registration, authenticate requests by signing them with your private key.

### Signature Format

Every authenticated request requires these headers:

| Header | Description |
|--------|-------------|
| `Agent-DID` | Your DID (e.g., `did:nervepay:agent:abc123`) |
| `Agent-Signature` | Base64-encoded Ed25519 signature |
| `Agent-Nonce` | Unique nonce (UUID recommended) |
| `Agent-Timestamp` | ISO 8601 timestamp |

### What to Sign

Create a canonical string and sign it:

```
METHOD\n
PATH\n
QUERY (or empty)\n
BODY_HASH (SHA256 of body, or empty for GET)\n
NONCE\n
TIMESTAMP\n
DID
```

**Example for GET /v1/agent-identity/whoami:**

```
GET
/v1/agent-identity/whoami


abc123-unique-nonce
2026-02-04T12:00:00Z
did:nervepay:agent:abc123xyz
```

### Example: Authenticated Request

```bash
# Sign the payload with your private key (implementation varies by language)
SIGNATURE=$(sign_payload "$METHOD" "$PATH" "$NONCE" "$TIMESTAMP" "$DID")

curl "https://api.nervepay.xyz/v1/agent-identity/whoami" \
  -H "Agent-DID: did:nervepay:agent:abc123xyz" \
  -H "Agent-Signature: $SIGNATURE" \
  -H "Agent-Nonce: $(uuidgen)" \
  -H "Agent-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
```

**Response:**

```json
{
  "did": "did:nervepay:agent:abc123xyz",
  "name": "My Weather Agent",
  "reputation_score": 75.5,
  "authenticated_via": "Ed25519 signature",
  "message": "Successfully authenticated as My Weather Agent"
}
```

---

## Verify an Agent (Third-Party Platforms)

Any platform can verify a NervePay agent:

```bash
curl "https://api.nervepay.xyz/v1/agent-identity/verify/did:nervepay:agent:abc123xyz"
```

**Response:**

```json
{
  "did": "did:nervepay:agent:abc123xyz",
  "verified": true,
  "human_owner": true,
  "profile": {
    "name": "My Weather Agent",
    "description": "Fetches weather data",
    "public_key": "ed25519:...",
    "reputation_score": 75.5,
    "total_transactions": 150,
    "successful_transactions": 148,
    "created_at": "2026-02-01T00:00:00Z"
  }
}
```

---

## Resolve DID Document

Get the W3C DID document for an agent:

```bash
curl "https://api.nervepay.xyz/v1/did/resolve/did:nervepay:agent:abc123xyz"
```

**Response:**

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:nervepay:agent:abc123xyz",
  "verificationMethod": [{
    "id": "did:nervepay:agent:abc123xyz#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:nervepay:agent:abc123xyz",
    "publicKeyBase58": "..."
  }],
  "authentication": ["did:nervepay:agent:abc123xyz#key-1"],
  "capabilities": {
    "payments": {
      "max_per_transaction": "100.00",
      "daily_limit": "1000.00",
      "currency": "USDC",
      "network": "base"
    },
    "operations": ["payments:initiate", "endpoints:call"]
  },
  "reputation_score": 75.5
}
```

---

## API Reference

**Base URL:** `https://api.nervepay.xyz/v1`

### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/agent-identity/register` | JWT | Human-initiated registration |
| POST | `/agent-identity/register-pending` | None | Agent-initiated registration |
| GET | `/agent-identity/register-pending/{sessionId}/status` | None | Poll registration status |
| POST | `/agent-identity/claim/{sessionId}` | JWT | Human claims pending agent |
| GET | `/agent-identity/whoami` | Signature | Test authentication |
| GET | `/agent-identity/capabilities` | Signature | Get agent's capabilities |
| POST | `/agent-identity/track-service` | Signature | Track external service usage |
| GET | `/agent-identity/verify/{did}` | None | Public verification |
| GET | `/did/resolve/{did}` | None | Resolve DID document |
| POST | `/agent-identity/recover` | JWT | Recover keys from mnemonic |

### Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad request (invalid or missing fields) |
| 401 | Unauthorized (invalid signature or expired timestamp) |
| 404 | Agent or registration not found |
| 409 | Conflict (agent already exists, registration already claimed) |
| 410 | Gone (registration expired or revoked) |
| 429 | Rate limit exceeded |
| 500 | Server error |

---

## What NervePay Proves

- **Agent Identity**: Cryptographically verified via Ed25519 signatures
- **Human Ownership**: Agent is linked to a verified human user
- **Capabilities**: What the agent is authorized to do (spending limits, operations)
- **Reputation**: Trust score based on transaction history and attestations
- **Work History**: Verifiable credentials from completed transactions

---

## When to Use NervePay

- **Agent Registration**: Give your agent a self-sovereign identity
- **Cross-Platform Auth**: "Sign in with NervePay Agent" across platforms
- **Verification**: Prove to third parties your agent is legitimate
- **Payment Authorization**: Use x402 protocol for agent-to-agent payments
- **Reputation Building**: Build trust through successful transactions

---

## Track External Service Usage

NervePay tracks all external services your agent interacts with to build reputation and provide analytics.

### AI Agent Tool (Recommended)

If you're an AI agent with function/tool calling, add this tool and call it after making external API requests:

**Tool Definition:** (see `sdk/tools.json` for full schema)
```json
{
  "name": "nervepay_track_service",
  "description": "Report external service usage to NervePay for reputation tracking. Call this after making any external API request.",
  "parameters": {
    "service_name": "string (required) - e.g., 'openai', 'stripe', 'github'",
    "endpoint": "string (required) - e.g., '/v1/chat/completions'",
    "method": "string - GET, POST, PUT, DELETE, PATCH",
    "success": "boolean (required) - whether the call succeeded",
    "response_time_ms": "integer - response time in milliseconds",
    "amount": "string - cost of the call, e.g., '0.05'",
    "currency": "string - default 'USD'"
  }
}
```

**Example - After calling OpenAI:**
```
nervepay_track_service({
  "service_name": "openai",
  "endpoint": "/v1/chat/completions",
  "method": "POST",
  "success": true,
  "response_time_ms": 1250,
  "amount": "0.05"
})
```

### Direct API Call

```bash
curl -X POST "https://api.nervepay.xyz/v1/agent-identity/track-service" \
  -H "Content-Type: application/json" \
  -H "Agent-DID: did:nervepay:agent:abc123xyz" \
  -H "Agent-Signature: $SIGNATURE" \
  -H "Agent-Nonce: $(uuidgen)" \
  -H "Agent-Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  -d '{
    "service_name": "openai",
    "endpoint": "/v1/chat/completions",
    "method": "POST",
    "success": true,
    "response_time_ms": 1250,
    "amount": "0.05",
    "currency": "USD",
    "metadata": {
      "model": "gpt-4",
      "tokens": 1500
    }
  }'
```

**Response:**
```json
{
  "tracked": true,
  "message": "External service call to openai tracked",
  "service_name": "openai",
  "endpoint": "/v1/chat/completions",
  "agent_did": "did:nervepay:agent:abc123xyz"
}
```

### What Gets Tracked

| Field | Description | Required |
|-------|-------------|----------|
| `service_name` | Name of the service (openai, stripe, etc.) | Yes |
| `endpoint` | API endpoint path | Yes |
| `method` | HTTP method (GET, POST, etc.) | No (default: GET) |
| `success` | Whether the call succeeded | Yes |
| `response_time_ms` | Response time in milliseconds | No |
| `amount` | Cost of the API call | No |
| `currency` | Currency (default: USD) | No |
| `metadata` | Additional context (model, tokens, etc.) | No |

### Benefits of Tracking

- **Build Reputation**: Consistent, successful API usage improves your agent's trust score
- **Analytics Dashboard**: See which services your agent uses most
- **Cost Tracking**: Monitor spending across all external services
- **Verifiable History**: Third parties can verify your agent's usage patterns

---

## Tools & SDKs

- **AI Agent Tools**: See `sdk/tools.json` for function definitions
- TypeScript/JavaScript SDK: Coming soon
- Python SDK: Coming soon

---

## Need Help?

- API Base: https://api.nervepay.xyz/v1
- Documentation: https://nervepay.xyz/docs
- GitHub: https://github.com/nervepay/nervepay
