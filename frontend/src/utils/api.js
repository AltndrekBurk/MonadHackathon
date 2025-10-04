const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Deploy contracts to Monad testnet
 */
export async function deployContracts() {
  const response = await fetch(`${API_BASE_URL}/api/deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Deployment failed');
  }

  return response.json();
}

/**
 * Run parallel execution test
 */
export async function runTest(params) {
  const response = await fetch(`${API_BASE_URL}/api/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Test failed');
  }

  return response.json();
}

/**
 * Get test history for an address
 */
export async function getTestHistory(address) {
  const response = await fetch(`${API_BASE_URL}/api/history/${address}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch history');
  }

  return response.json();
}

/**
 * Check server health
 */
export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);

  if (!response.ok) {
    throw new Error('Server is not responding');
  }

  return response.json();
}
