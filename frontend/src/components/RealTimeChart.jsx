import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'

function RealTimeChart({ data }) {
  if (!data || data.length === 0) return null

  // Prepare data for the chart
  const chartData = data.map((item, index) => ({
    time: index,
    completed: item.completed,
    success: item.success,
    failed: item.failed,
    latency: item.latency
  }))

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
          <p className="text-white font-medium">Transaction #{label + 1}</p>
          <p className="text-green-400">✅ Success: {data.success}</p>
          <p className="text-red-400">❌ Failed: {data.failed}</p>
          <p className="text-blue-400">⏱️ Latency: {data.latency}ms</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="time" 
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
            tickFormatter={(value) => `#${value + 1}`}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.6)"
            fontSize={12}
            tickFormatter={(value) => `${value}ms`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Success Area */}
          <Area
            type="monotone"
            dataKey="success"
            stackId="1"
            stroke="#10B981"
            fill="rgba(16, 185, 129, 0.3)"
            strokeWidth={2}
          />
          
          {/* Failed Area */}
          <Area
            type="monotone"
            dataKey="failed"
            stackId="1"
            stroke="#EF4444"
            fill="rgba(239, 68, 68, 0.3)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex justify-center space-x-6 mt-4 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-green-400">Successful</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span className="text-red-400">Failed</span>
        </div>
      </div>
    </div>
  )
}

export default RealTimeChart
