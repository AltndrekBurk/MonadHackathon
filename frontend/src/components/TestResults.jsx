import React from 'react'
import { CheckCircle, XCircle, Clock, Zap, Target, TrendingUp } from 'lucide-react'

function TestResults({ results }) {
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    if (score >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
      <h3 className="text-white text-xl font-semibold mb-4 flex items-center">
        <Target className="mr-2" />
        Test Results
      </h3>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className={`text-6xl font-bold ${getScoreColor(results.parallelScore)}`}>
          {results.parallelScore}
        </div>
        <div className="text-blue-200 text-lg">
          {getScoreLabel(results.parallelScore)} Performance
        </div>
        <div className="text-blue-300 text-sm">
          Parallel Execution Score
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-200 text-sm">Success Rate</div>
            <CheckCircle className="text-green-400" size={16} />
          </div>
          <div className="text-2xl font-bold text-white">
            {results.successRate}%
          </div>
          <div className="text-blue-300 text-xs">
            {results.ok} / {results.sent} transactions
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-200 text-sm">Failed</div>
            <XCircle className="text-red-400" size={16} />
          </div>
          <div className="text-2xl font-bold text-white">
            {results.fail}
          </div>
          <div className="text-blue-300 text-xs">
            {100 - results.successRate}% failure rate
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-200 text-sm">Avg Latency</div>
            <Clock className="text-yellow-400" size={16} />
          </div>
          <div className="text-2xl font-bold text-white">
            {results.avgLatency}ms
          </div>
          <div className="text-blue-300 text-xs">
            P95: {results.p95Latency}ms
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-blue-200 text-sm">Avg Gas</div>
            <Zap className="text-purple-400" size={16} />
          </div>
          <div className="text-2xl font-bold text-white">
            {results.avgGas}
          </div>
          <div className="text-blue-300 text-xs">
            Gas per transaction
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="bg-white/10 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <TrendingUp className="mr-2" />
          Performance Analysis
        </h4>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-blue-200">Function:</span>
            <span className="text-white font-mono">{results.functionName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-blue-200">Contract:</span>
            <span className="text-white font-mono text-xs">
              {results.contractAddress.slice(0, 10)}...{results.contractAddress.slice(-8)}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-blue-200">Test Time:</span>
            <span className="text-white">
              {new Date(results.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-4">
        <h4 className="text-white font-medium mb-2">Recommendations</h4>
        <div className="text-sm text-blue-200">
          {results.parallelScore >= 80 ? (
            <div className="text-green-300">
              ✅ Excellent! Your contract is optimized for parallel execution.
            </div>
          ) : results.parallelScore >= 60 ? (
            <div className="text-yellow-300">
              ⚠️ Good performance, but consider optimizing storage access patterns.
            </div>
          ) : (
            <div className="text-red-300">
              ❌ Poor parallel execution. Consider using sharded storage patterns.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestResults
