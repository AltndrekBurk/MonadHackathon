import React from 'react'
import { Play, Zap } from 'lucide-react'

function ContractInput({ 
  contractAddress, 
  setContractAddress, 
  functionName, 
  setFunctionName, 
  onRunTest, 
  isRunning 
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
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-blue-300 text-xs mt-1">
            Enter your deployed contract address
          </p>
        </div>

        {/* Function Selection */}
        <div>
          <label className="block text-blue-200 text-sm font-medium mb-2">
            Function to Test
          </label>
          <select
            value={functionName}
            onChange={(e) => setFunctionName(e.target.value)}
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="globalInc" className="bg-gray-800">globalInc (Hotspot)</option>
            <option value="shardedInc" className="bg-gray-800">shardedInc (Parallel)</option>
          </select>
        </div>

        {/* Test Parameters */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Bot Count
            </label>
            <input
              type="number"
              defaultValue={30}
              min={10}
              max={50}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-blue-200 text-sm font-medium mb-2">
              Burst Size
            </label>
            <input
              type="number"
              defaultValue={30}
              min={10}
              max={50}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Run Test Button */}
        <button
          onClick={onRunTest}
          disabled={isRunning || !contractAddress}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
        >
          {isRunning ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Running Test...
            </>
          ) : (
            <>
              <Play className="mr-2" />
              Run Parallel Test
            </>
          )}
        </button>

        {/* Quick Deploy */}
        <div className="border-t border-white/20 pt-4">
          <p className="text-blue-200 text-sm mb-2">Don't have a contract?</p>
          <button className="w-full bg-green-500/20 hover:bg-green-500/30 text-green-300 font-medium py-2 px-4 rounded-lg transition-colors">
            Deploy Test Contract
          </button>
        </div>
      </div>
    </div>
  )
}

export default ContractInput
