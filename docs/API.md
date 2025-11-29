# API Reference

Base URL: `http://localhost:5000`

## Event Listening

### `GET /listen`

Establishes a Server-Sent Events (SSE) connection to stream logs for a specific contract.

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `address` | string | Yes | The Ethereum contract address (0x...). |
| `topic0` | string | Yes | The event signature hash (topic0). |
| `abi` | string | Yes | Base64 encoded JSON string of the contract ABI. |

**Response (Stream):**

- `event: connected`: Connection established.
- `event: status`: Status updates (e.g., "catching-up", "listening").
- `event: log`: A new event log.
    ```json
    {
      "encoded": { ...raw log... },
      "decoded": {
        "eventName": "Transfer",
        "args": { "from": "0x...", "to": "0x...", "value": "1000" }
      }
    }
    ```

## Subscriptions

### `POST /api/subscriptions`

Save a subscription configuration to the database for persistence and workflow triggering.

**Body:**

```json
{
  "address": "0x...",
  "topic0": "0x...",
  "abi": [...],
  "blocknumber": 123456,
  "ActionName": "Notify Discord",
  "ActionType": "API",
  "api": "https://discord.com/api/webhooks/..."
}
```

**Response:**

```json
{
  "data": { ...created record... }
}
```

## Workflows

### `GET /api/workflows`

Retrieve a list of active workflows.

**Response:**

```json
[
  {
    "id": 1,
    "ActionName": "Notify Discord",
    "ActionStatus": 200,
    ...
  }
]
```

## System

### `GET /health`

Check the server health and active subscriptions.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2025-11-29T...",
  "activeSubscriptions": ["0x...-0x..."]
}
```
