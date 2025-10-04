import React, { useState, useEffect } from 'react'
import { Play, Zap, TrendingUp, Clock, Target, Wifi, WifiOff, Wallet, Save } from 'lucide-react'
import { ethers } from 'ethers'
import ContractInput from './components/ContractInput'
import TestResults from './components/TestResults'
import RealTimeChart from './components/RealTimeChart'
import { useWebSocket } from './hooks/useWebSocket'
import { useMetaMask } from './hooks/useMetaMask'
import { runTest, deployContracts } from './utils/api'
import {  
  runParallelTest,
  saveTestToBlockchain,
  getContractStats,
  getLatestTests,
  formatAddress
} from './utils/blockchain'
import { CONTRACTS, ABIS } from './config'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';

function App() {
  const [contractAddress, setContractAddress] = useState(CONTRACTS.PARALLEL_PROBE)
  const [functionName, setFunctionName] = useState('globalInc')
  const [botsCount, setBotsCount] = useState(30)
  const [burstSize, setBurstSize] = useState(30)
  const [isRunning, setIsRunning] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [testResults, setTestResults] = useState(null)
  const [realTimeData, setRealTimeData] = useState([])
  const [error, setError] = useState(null)
  const [useMetaMaskMode, setUseMetaMaskMode] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [onChainStats, setOnChainStats] = useState(null)
  
  const { lastMessage, sendMessage, isConnected } = useWebSocket(WS_URL)
  const { 
    account, 
    signer, 
    provider,
    isConnected: isMetaMaskConnected, 
    connect: connectMetaMask,
    isConnecting,
    error: metaMaskError
  } = useMetaMask()

  useEffect(() => {
    if (lastMessage) {
      try {
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
        } else if (data.type === 'error') {
          setError(data.message)
          setIsRunning(false)
        } else if (data.type === 'test_started') {
          console.log('Test started:', data)
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e)
      }
    }
  }, [lastMessage])

  const handleDeploy = async () => {
    setIsDeploying(true)
    setError(null)

    try {
      const result = await deployContracts()
      setContractAddress(result.probeAddress)
      alert(`✅ Contracts deployed!\n\nParallelProbe: ${result.probeAddress}\n\nView on explorer: ${result.explorerUrls.probe}`)
    } catch (error) {
      console.error('Deploy failed:', error)
      setError(error.message)
      alert(`❌ Deployment failed: ${error.message}`)
    } finally {
      setIsDeploying(false)
    }
  }

  // YENİ WORKFLOW: Test isteği gönder (blockchain'e yaz)
  const handleRequestTest = async () => {
    if (!contractAddress) {
      alert('Please enter a contract address')
      return
    }

    if (!isMetaMaskConnected) {
      alert('Please connect MetaMask first')
      return
    }

    setIsRunning(true)
    setTestResults(null)
    setRealTimeData([])
    setError(null)

    try {
      console.log('📤 Sending test request to blockchain...')
      
      // Connect to TestResultStorage contract
      const contract = new ethers.Contract(
        CONTRACTS.TEST_RESULT_STORAGE,
        ABIS.TEST_RESULT_STORAGE,
        signer
      )
      
      // Request test - blockchain'e yaz
      console.log('Contract:', contractAddress)
      console.log('Function:', functionName)
      console.log('TX Count:', burstSize)
      
      const tx = await contract.requestTest(
        contractAddress,
        functionName,
        burstSize
      )
      
      console.log('✅ TX sent:', tx.hash)
      console.log('⏳ Waiting for confirmation...')
      
      const receipt = await tx.wait()
      
      console.log('✅ Test request confirmed!')
      console.log('Block:', receipt.blockNumber)
      console.log('💬 Backend will now run the test...')
      
      alert(`✅ Test request sent!\n\nTX: ${tx.hash}\n\nBackend is running your test now.\nResults will appear automatically when ready.`)
      
      // Listen for TestCompleted event
      listenForTestCompletion(contract)
      
    } catch (error) {
      console.error('❌ Test request failed:', error)
      setError(error.message)
      setIsRunning(false)
      alert(`❌ Failed to send test request:\n\n${error.message}`)
    }
  }
  
  // Listen for test completion using polling (Alchemy doesn't support eth_newFilter)
  const listenForTestCompletion = (contract) => {
    console.log('👂 Listening for test completion using polling...')
    
    let pollCount = 0
    const maxPolls = 60 // 3 minutes max (60 * 3 seconds)
    
    const pollForCompletion = async () => {
      try {
        pollCount++
        console.log(`🔍 Polling for completion... (${pollCount}/${maxPolls})`)
        
        // Get latest TestCompleted events
        const filter = contract.filters.TestCompleted()
        const events = await contract.queryFilter(filter, -10) // Last 10 blocks
        
        // Check if any event is for this user
        for (const event of events) {
          const [testId, tester, functionName, successRate, parallelScore] = event.args
          
          if (tester.toLowerCase() === account.toLowerCase()) {
            console.log('🎉 MY TEST COMPLETED!')
            console.log('Test ID:', testId)
            console.log('Success Rate:', Number(successRate) + '%')
            console.log('Parallel Score:', Number(parallelScore))
            
            // Stop running state
            setIsRunning(false)
            
            // Reload on-chain stats to get the latest results
            loadOnChainStats()
            
            // Load test results from blockchain
            loadTestResults()
            
            // Show success message
            alert(`🎉 Test Completed!\n\nParallel Score: ${Number(parallelScore)}/100\nSuccess Rate: ${Number(successRate)}%`)
            
            return // Stop polling
          }
        }
        
        // Continue polling if not found and under limit
        if (pollCount < maxPolls) {
          setTimeout(pollForCompletion, 3000) // Poll every 3 seconds
        } else {
          console.log('⏰ Polling timeout - test may have failed')
          setIsRunning(false)
        }
        
      } catch (error) {
        console.error('❌ Error polling for completion:', error)
        setIsRunning(false)
      }
    }
    
    // Start polling
    pollForCompletion()
  }
  
  // ESKİ: MetaMask ile direkt test (artık kullanılmayacak ama bırakalım)
  const handleRunTestWithMetaMask = async () => {
    if (!contractAddress) {
      alert('Please enter a contract address')
      return
    }

    if (!isMetaMaskConnected) {
      alert('Please connect MetaMask first')
      return
    }

    setIsRunning(true)
    setTestResults(null)
    setRealTimeData([])
    setError(null)

    try {
      const result = await runParallelTest(
        signer,
        contractAddress,
        functionName,
        burstSize,
        (progress) => {
          // Real-time progress updates
          setRealTimeData(prev => [...prev, {
            time: Date.now(),
            completed: progress.completed,
            success: progress.success,
            failed: progress.failed,
            latency: progress.currentLatency
          }])
        }
      )
      
      setTestResults(result)
      setIsRunning(false)
    } catch (error) {
      console.error('MetaMask test failed:', error)
      setError(error.message)
      setIsRunning(false)
    }
  }

  // Backend ile test çalıştır (eski yöntem)
  const handleRunTest = async () => {
    if (!contractAddress) {
      alert('Please enter a contract address or deploy a new one')
      return
    }

    setIsRunning(true)
    setTestResults(null)
    setRealTimeData([])
    setError(null)

    try {
      await runTest({
        contractAddress,
        functionName,
        botsCount,
        burstSize
      })
    } catch (error) {
      console.error('Test failed:', error)
      setError(error.message)
      setIsRunning(false)
    }
  }

  // Sonuçları blockchain'e kaydet
  const handleSaveToBlockchain = async () => {
    if (!testResults) {
      alert('No test results to save')
      return
    }

    if (!isMetaMaskConnected) {
      alert('Please connect MetaMask first')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const result = await saveTestToBlockchain(signer, testResults)
      alert(`✅ Test results saved to blockchain!\n\nTest ID: ${result.testId}\nBlock: ${result.blockNumber}`)
      
      // Refresh on-chain stats
      if (provider) {
        loadOnChainStats()
      }
    } catch (error) {
      console.error('Save failed:', error)
      setError(error.message)
      alert(`❌ Failed to save: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  // On-chain stats yükle
  const loadOnChainStats = async () => {
    if (!provider || !contractAddress) return

    try {
      const stats = await getContractStats(provider, contractAddress)
      setOnChainStats(stats)
      console.log('📊 On-chain stats loaded:', stats)
    } catch (error) {
      console.error('Failed to load on-chain stats:', error)
    }
  }

  // Test sonuçlarını zincirden yükle
  const loadTestResults = async () => {
    if (!provider || !account) return

    try {
      console.log('🔄 Loading test results from blockchain...')
      const latestTests = await getLatestTests(provider, 1) // Son 1 test
      
      if (latestTests.length > 0) {
        const latestTest = latestTests[0]
        console.log('📊 Latest test from blockchain:', latestTest)
        
        // Test sonuçlarını güncelle
        setTestResults({
          successRate: latestTest.successRate,
          parallelScore: latestTest.parallelScore,
          avgLatency: latestTest.avgLatency,
          avgGas: latestTest.avgGas,
          success: latestTest.success,
          fail: latestTest.failed,
          sent: latestTest.sent
        })
        
        console.log('✅ Test results updated from blockchain')
      }
    } catch (error) {
      console.error('Failed to load test results:', error)
    }
  }

  // Contract address değiştiğinde stats yükle
  useEffect(() => {
    if (provider && contractAddress) {
      loadOnChainStats()
    }
  }, [provider, contractAddress])

  // Account değiştiğinde test sonuçlarını yükle
  useEffect(() => {
    if (provider && account) {
      loadTestResults()
    }
  }, [provider, account])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🚀 Monad Parallel Execution Tester
          </h1>
          <p className="text-blue-200 text-lg mb-4">
            Test your smart contracts for parallel execution performance
          </p>
          
          {/* Connection Status & MetaMask */}
          <div className="flex items-center justify-center space-x-6 mb-4">
            {/* Server Connection */}
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="text-green-400" size={16} />
                  <span className="text-green-400 text-sm">Server Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="text-red-400" size={16} />
                  <span className="text-red-400 text-sm">Server Offline</span>
                </>
              )}
            </div>
            
            {/* MetaMask Connection */}
            <div>
              {isMetaMaskConnected ? (
                <div className="flex items-center space-x-2 bg-green-500/20 px-4 py-2 rounded-lg">
                  <Wallet className="text-green-400" size={16} />
                  <span className="text-green-400 text-sm font-medium">
                    {formatAddress(account)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={connectMetaMask}
                  disabled={isConnecting}
                  className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  <Wallet className="text-white" size={16} />
                  <span className="text-white text-sm font-medium">
                    {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                  </span>
                </button>
              )}
            </div>
          </div>
          
          {/* Workflow Info */}
          <div className="flex items-center justify-center space-x-2 text-sm text-blue-200">
            <span>📝 Request Test →</span>
            <span>🎧 Backend Listens →</span>
            <span>🤖 Bots Execute →</span>
            <span>💾 Results Saved →</span>
            <span>📊 You See Stats</span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-200 text-center">❌ {error}</p>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input & Controls */}
          <div className="space-y-6">
            <ContractInput
              contractAddress={contractAddress}
              setContractAddress={setContractAddress}
              functionName={functionName}
              setFunctionName={setFunctionName}
              botsCount={botsCount}
              setBotsCount={setBotsCount}
              burstSize={burstSize}
              setBurstSize={setBurstSize}
              onRunTest={handleRequestTest}
              onDeploy={handleDeploy}
              isRunning={isRunning}
              isDeploying={isDeploying}
            />
            
            {/* On-Chain Stats */}
            {onChainStats && onChainStats.testCount > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
                <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                  <Target className="mr-2" />
                  On-Chain Statistics
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">{onChainStats.testCount}</div>
                    <div className="text-blue-200 text-sm">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">{onChainStats.avgScore}</div>
                    <div className="text-blue-200 text-sm">Avg Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400">{onChainStats.bestScore}</div>
                    <div className="text-blue-200 text-sm">Best Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">{onChainStats.worstScore}</div>
                    <div className="text-blue-200 text-sm">Worst Score</div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-blue-300 text-center">
                  📊 Data from blockchain
                </div>
              </div>
            )}
            
            {/* Test Status Info */}
            {isRunning && (
              <div className="bg-yellow-500/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500">
                <div className="text-center">
                  <div className="text-yellow-400 font-semibold mb-2">
                    🎧 Backend is running your test...
                  </div>
                  <div className="text-yellow-200 text-sm">
                    Bots are executing parallel transactions.
                    Results will appear automatically when complete.
                  </div>
                  <div className="mt-4">
                    <div className="animate-spin inline-block w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
            )}

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

            {/* Performance Metrics */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                <Target className="mr-2" />
                Performance Metrics
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-3xl font-bold text-green-400">
                    {testResults?.successRate || 0}%
                  </div>
                  <div className="text-green-200 text-sm">Success Rate</div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${testResults?.successRate || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                  <div className="text-3xl font-bold text-yellow-400">
                    {testResults?.avgLatency || 0}ms
                  </div>
                  <div className="text-yellow-200 text-sm">Avg Latency</div>
                  <div className="text-xs text-yellow-300 mt-1">
                    {testResults?.avgLatency > 5000 ? '🐌 Slow' : testResults?.avgLatency > 2000 ? '⚡ Medium' : '🚀 Fast'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-3xl font-bold text-blue-400">
                    {testResults?.parallelScore || 0}/100
                  </div>
                  <div className="text-blue-200 text-sm">Parallel Score</div>
                  {/* Progress bar */}
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${testResults?.parallelScore || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                  <div className="text-3xl font-bold text-purple-400">
                    {testResults?.avgGas || 0}
                  </div>
                  <div className="text-purple-200 text-sm">Avg Gas</div>
                  <div className="text-xs text-purple-300 mt-1">
                    {testResults?.avgGas > 100000 ? '⛽ High' : testResults?.avgGas > 50000 ? '⚡ Medium' : '💨 Low'}
                  </div>
                </div>
              </div>
            </div>

            {/* Function Comparison */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
                <Zap className="mr-2" />
                Function Types
              </h3>
              
              <div className="space-y-4">
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  functionName === 'globalInc' 
                    ? 'bg-red-500/20 border-red-500/50' 
                    : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div>
                    <div className="text-white font-bold text-lg">globalInc</div>
                    <div className="text-red-200 text-sm">Hotspot - All transactions conflict</div>
                    <div className="text-red-300 text-xs mt-1">⚠️ Worst case for parallel execution</div>
                  </div>
                  <div className="text-red-400 text-2xl">⚠️</div>
                </div>
                
                <div className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  functionName === 'shardedInc' 
                    ? 'bg-green-500/20 border-green-500/50' 
                    : 'bg-green-500/10 border-green-500/30'
                }`}>
                  <div>
                    <div className="text-white font-bold text-lg">shardedInc</div>
                    <div className="text-green-200 text-sm">Parallel-friendly - Independent storage</div>
                    <div className="text-green-300 text-xs mt-1">✅ Best case for parallel execution</div>
                  </div>
                  <div className="text-green-400 text-2xl">✅</div>
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
