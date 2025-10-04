import React, { useState, useEffect } from 'react'
import { Play, Zap, TrendingUp, Clock, Target } from 'lucide-react'
import ContractInput from './components/ContractInput'
import TestResults from './components/TestResults'
import RealTimeChart from './components/RealTimeChart'
import { useWebSocket } from './hooks/useWebSocket'
import { runTest } from './utils/api'

function App() {
  const [contractAddress, setContractAddress] = useState('')
  const [functionName, setFunctionName] = useState('globalInc')
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [realTimeData, setRealTimeData] = useState([])
  
  const { lastMessage, sendMessage } = useWebSocket('ws://localhost:3001')

  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage.data)
      
      if (data.type === 'progress') {
        setRealTimeData(prev => [...prev, {
          time: Date.now(),
          completed: data.completed,
          success: data.success,
          failed: data.failed,
          latency: data.currentLatency
        }])
      } else if (data.type === 'result') {
        setTestResults(data.data)
        setIsRunning(false)
      }
    }
  }, [lastMessage])

  const handleRunTest = async () => {
    if (!contractAddress) {
      alert('Please enter a contract address')
      return
    }

    setIsRunning(true)
    setTestResults(null)
    setRealTimeData([])

    try {
      await runTest({
        contractAddress,
        functionName,
        botsCount: 30,
        burstSize: 30
      })
    } catch (error) {
      console.error('Test failed:', error)
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 Monad Parallel Execution Tester
          </h1>
          <p className="text-blue-200 text-lg">
            Test your smart contracts for parallel execution performance
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input & Controls */}
          <div className="space-y-6">
            <ContractInput
              contractAddress={contractAddress}
              setContractAddress={setContractAddress}
              functionName={functionName}
              setFunctionName={setFunctionName}
              onRunTest={handleRunTest}
              isRunning={isRunning}
            />

            {/* Real-time Chart */}
            {realTimeData.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="mr-2" />
                  Real-time Performance
                </h3>
                <RealTimeChart data={realTimeData} />
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            {testResults && (
              <TestResults results={testResults} />
            )}

            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                <Target className="mr-2" />
                Performance Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {testResults?.successRate || 0}%
                  </div>
                  <div className="text-blue-200 text-sm">Success Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {testResults?.avgLatency || 0}ms
                  </div>
                  <div className="text-blue-200 text-sm">Avg Latency</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {testResults?.parallelScore || 0}/100
                  </div>
                  <div className="text-blue-200 text-sm">Parallel Score</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400">
                    {testResults?.avgGas || 0}
                  </div>
                  <div className="text-blue-200 text-sm">Avg Gas</div>
                </div>
              </div>
            </div>

            {/* Function Comparison */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-4">
                Function Types
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-red-500/20 rounded-lg">
                  <div>
                    <div className="text-white font-medium">globalInc</div>
                    <div className="text-red-200 text-sm">Hotspot - All transactions conflict</div>
                  </div>
                  <div className="text-red-400 font-bold">⚠️</div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-500/20 rounded-lg">
                  <div>
                    <div className="text-white font-medium">shardedInc</div>
                    <div className="text-green-200 text-sm">Parallel-friendly - Independent storage</div>
                  </div>
                  <div className="text-green-400 font-bold">✅</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-blue-200">
          <p>Built for Monad Testnet • 
            <a href="https://faucet.monad.xyz" target="_blank" rel="noopener noreferrer" className="text-blue-300 hover:text-blue-100 ml-1">
              Get Test MON
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
