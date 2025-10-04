import React from 'react'
import { CheckCircle, XCircle, Clock, Fuel, Target, TrendingUp } from 'lucide-react'

function TestResults({ results }) {
  if (!results) return null

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
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
        <div className="text-blue-300 text-sm mt-1">
          Parallel Execution Score
        </div>
      </div>

      {/* Transaction Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-green-500/20 rounded-lg">
          <div className="text-2xl font-bold text-green-400 flex items-center justify-center">
            <CheckCircle className="mr-2" size={24} />
            {results.ok}
          </div>
          <div className="text-green-200 text-sm">Successful</div>
        </div>
        
        <div className="text-center p-4 bg-red-500/20 rounded-lg">
          <div className="text-2xl font-bold text-red-400 flex items-center justify-center">
            <XCircle className="mr-2" size={24} />
            {results.fail}
          </div>
          <div className="text-red-200 text-sm">Failed</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center">
            <Clock className="text-blue-400 mr-3" size={20} />
            <div>
              <div className="text-white font-medium">Average Latency</div>
              <div className="text-blue-200 text-sm">Transaction processing time</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-400">{results.avgLatency}ms</div>
            <div className="text-blue-300 text-sm">P95: {results.p95Latency}ms</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center">
            <Fuel className="text-purple-400 mr-3" size={20} />
            <div>
              <div className="text-white font-medium">Gas Consumption</div>
              <div className="text-blue-200 text-sm">Average gas per transaction</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">{results.avgGas.toLocaleString()}</div>
            <div className="text-blue-300 text-sm">gas units</div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
          <div className="flex items-center">
            <TrendingUp className="text-green-400 mr-3" size={20} />
            <div>
              <div className="text-white font-medium">Success Rate</div>
              <div className="text-blue-200 text-sm">Percentage of successful transactions</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">{results.successRate}%</div>
            <div className="text-blue-300 text-sm">{results.ok}/{results.sent} transactions</div>
          </div>
        </div>
      </div>

      {/* Test Details */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="text-sm text-blue-300 space-y-1">
          <div><strong>Contract:</strong> {results.contractAddress}</div>
          <div><strong>Function:</strong> {results.functionName}</div>
          <div><strong>Total Sent:</strong> {results.sent} transactions</div>
          <div><strong>Test Time:</strong> {new Date(results.timestamp).toLocaleString()}</div>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg">
        <h4 className="text-white font-semibold mb-2">Performance Analysis</h4>
        <div className="text-sm text-blue-200 space-y-1">
          {results.parallelScore >= 80 && (
            <p>✅ Excellent parallel execution performance! Your contract handles concurrent transactions very well.</p>
          )}
          {results.parallelScore >= 60 && results.parallelScore < 80 && (
            <p>⚠️ Good performance, but there's room for improvement in parallel execution.</p>
          )}
          {results.parallelScore < 60 && (
            <p>❌ Poor parallel execution. Consider optimizing your contract for better concurrency.</p>
          )}
          
          {results.avgLatency > 5000 && (
            <p>🐌 High latency detected. Check network conditions and gas settings.</p>
          )}
          
          {results.successRate < 90 && (
            <p>⚠️ Low success rate. Review contract logic and gas limits.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestResults
