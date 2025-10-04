# API Reference

This document provides detailed information about the Monad Parallel Tester Framework API.

## Backend API

The backend provides a REST API and WebSocket interface for testing parallel execution.

### Base URL

```
http://localhost:3001/api
```

### Authentication

Currently, no authentication is required. In production, consider implementing API keys or JWT tokens.

## REST Endpoints

### Health Check

Check if the server is running and connected to the blockchain.

```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "online",
  "network": "https://monad-testnet.g.alchemy.com/v2/..."
}
```

### Deploy Contracts

Deploy the test contracts to the blockchain.

```http
POST /api/deploy
```

**Response:**
```json
{
  "success": true,
  "probeAddress": "0x...",
  "resultAddress": "0x...",
  "explorerUrls": {
    "probe": "https://testnet.monadexplorer.com/address/0x...",
    "result": "https://testnet.monadexplorer.com/address/0x..."
  }
}
```

### Run Test

Execute a parallel execution test.

```http
POST /api/test
Content-Type: application/json

{
  "contractAddress": "0x...",
  "functionName": "globalInc",
  "botsCount": 30,
  "burstSize": 30
}
```

**Parameters:**
- `contractAddress` (string, required): Address of the test contract
- `functionName` (string, required): Function to test (`globalInc` or `shardedInc`)
- `botsCount` (number, optional): Number of bot wallets to create (default: 30, max: 100)
- `burstSize` (number, optional): Total number of transactions to send (default: 30, max: 100)

**Response:**
```json
{
  "success": true,
  "contractAddress": "0x...",
  "functionName": "globalInc",
  "sent": 30,
  "ok": 28,
  "fail": 2,
  "avgLatency": 1250,
  "p95Latency": 2100,
  "avgGas": 45000,
  "successRate": 93,
  "parallelScore": 78,
  "timestamp": 1703123456789
}
```

### Get Test History

Retrieve test history for a specific address.

```http
GET /api/history/{address}
```

**Response:**
```json
{
  "success": true,
  "results": []
}
```

## WebSocket API

Connect to `ws://localhost:3001` for real-time updates.

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.onopen = () => {
  console.log('Connected to Monad Parallel Tester');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

### Message Types

#### Connection Confirmation
```json
{
  "type": "connected",
  "message": "Connected to Monad Parallel Tester"
}
```

#### Test Started
```json
{
  "type": "test_started",
  "contractAddress": "0x...",
  "functionName": "globalInc",
  "botsCount": 30,
  "burstSize": 30
}
```

#### Progress Update
```json
{
  "type": "progress",
  "completed": 15,
  "total": 30,
  "success": 14,
  "failed": 1,
  "currentLatency": 1200
}
```

#### Test Result
```json
{
  "type": "result",
  "data": {
    "success": true,
    "contractAddress": "0x...",
    "functionName": "globalInc",
    "sent": 30,
    "ok": 28,
    "fail": 2,
    "avgLatency": 1250,
    "p95Latency": 2100,
    "avgGas": 45000,
    "successRate": 93,
    "parallelScore": 78,
    "timestamp": 1703123456789
  }
}
```

#### Error
```json
{
  "type": "error",
  "message": "Error description"
}
```

#### Heartbeat
```json
{
  "type": "heartbeat",
  "timestamp": 1703123456789,
  "clients": 3
}
```

## Frontend API

The frontend provides utility functions for interacting with the backend.

### API Functions

#### deployContracts()
Deploy test contracts to the blockchain.

```javascript
import { deployContracts } from './utils/api';

const result = await deployContracts();
console.log('Probe Address:', result.probeAddress);
```

#### runTest(params)
Run a parallel execution test.

```javascript
import { runTest } from './utils/api';

const result = await runTest({
  contractAddress: '0x...',
  functionName: 'globalInc',
  botsCount: 30,
  burstSize: 30
});
console.log('Parallel Score:', result.parallelScore);
```

#### getTestHistory(address)
Get test history for an address.

```javascript
import { getTestHistory } from './utils/api';

const history = await getTestHistory('0x...');
console.log('Test Results:', history.results);
```

#### checkHealth()
Check server health.

```javascript
import { checkHealth } from './utils/api';

const health = await checkHealth();
console.log('Server Status:', health.status);
```

### WebSocket Hook

Use the `useWebSocket` hook for real-time communication.

```javascript
import { useWebSocket } from './hooks/useWebSocket';

function MyComponent() {
  const { lastMessage, sendMessage, isConnected } = useWebSocket('ws://localhost:3001');
  
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data);
      console.log('Received:', data);
    }
  }, [lastMessage]);
  
  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );
}
```

## Error Handling

### Common Error Codes

- `400 Bad Request`: Invalid request parameters
- `500 Internal Server Error`: Server-side error
- `WebSocket Error`: Connection issues

### Error Response Format

```json
{
  "success": false,
  "error": "Error description"
}
```

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing:

- Request rate limiting per IP
- WebSocket connection limits
- Test execution limits per user

## CORS Configuration

The API supports CORS for cross-origin requests. Configure in `backend/src/config/index.js`:

```javascript
cors: {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}
```

## Security Considerations

- Never expose private keys in client-side code
- Use environment variables for sensitive configuration
- Implement authentication for production use
- Validate all input parameters
- Rate limit API endpoints
- Use HTTPS in production
