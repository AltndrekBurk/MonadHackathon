import React from 'react'
import { Play, Zap, Rocket } from 'lucide-react'

function ContractInput({ 
  contractAddress, 
  setContractAddress, 
  functionName, 
  setFunctionName,
  botsCount,
  setBotsCount,
  burstSize,
  setBurstSize,
  onRunTest,
  onDeploy,
  isRunning,
  isDeploying
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
        <Zap className="mr-2" />
        Test Configuration
      </h3>
      
      <div className="space-y-4">
        {/* Contract Address Input */}
        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">
            Contract Address
          </label>
          <input
            type="text"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Function Selection */}
        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">
            Test Function
          </label>
          <select
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="globalInc" className="bg-gray-800">globalInc (Hotspot)</option>
            <option value="shardedInc" className="bg-gray-800">shardedInc (Parallel)</option>
          </select>
        </div>

        {/* Bot Count */}
        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">
            Bot Count: {botsCount}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={botsCount}
            onChange={(e) => setBotsCount(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-blue-300 mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        {/* Burst Size */}
        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">
            Burst Size: {burstSize}
          </label>
          <input
            type="range"
            min="1"
            max="100"
            value={burstSize}
            onChange={(e) => setBurstSize(parseInt(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-blue-300 mt-1">
            <span>1</span>
            <span>100</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onDeploy}
            disabled={isDeploying}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Rocket className="w-5 h-5" />
            <span>{isDeploying ? 'Deploying...' : 'Deploy Test Contract'}</span>
          </button>

          <button
            onClick={onRunTest}
            disabled={isRunning || !contractAddress}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>{isRunning ? 'Running Test...' : 'Run Parallel Test'}</span>
          </button>
        </div>

        {/* Info */}
        <div className="text-sm text-blue-300 space-y-1">
          <p>• <strong>globalInc</strong>: All transactions conflict (worst case)</p>
          <p>• <strong>shardedInc</strong>: Independent storage (parallel-friendly)</p>
          <p>• Higher bot count = more parallel transactions</p>
          <p>• Burst size = total transactions to send</p>
        </div>
      </div>
    </div>
  )
}

export default ContractInput
