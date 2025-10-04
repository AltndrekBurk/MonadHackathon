const API_BASE = 'http://localhost:3001/api'

export async function deployContract() {
  const response = await fetch(`${API_BASE}/deploy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  
  if (!response.ok) {
    throw new Error('Failed to deploy contract')
  }
  
  return response.json()
}

export async function runTest(testConfig) {
  const response = await fetch(`${API_BASE}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testConfig),
  })
  
  if (!response.ok) {
    throw new Error('Failed to run test')
  }
  
  return response.json()
}

export async function getTestHistory(address) {
  const response = await fetch(`${API_BASE}/history/${address}`)
  
  if (!response.ok) {
    throw new Error('Failed to get test history')
  }
  
  return response.json()
}
