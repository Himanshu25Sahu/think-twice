"use client"
import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import AnalyticsCard from "../../components/ui/AnalyticsCard.js"
import { analyticsService } from "../../services/analyticsService"

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null)
  const [timeRange, setTimeRange] = useState("month")
  const [loading, setLoading] = useState(true)
  const userId = "currentUserId"; // Replace with actual user ID from auth context or state

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await analyticsService.getAnalytics(userId)
        if (response.success) {
          setAnalyticsData(response.data)
        }
      } catch (error) {
        console.error("Error fetching analytics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [userId])

  const categoryColors = {
    career: "bg-blue-500",
    personal: "bg-purple-500",
    financial: "bg-green-500",
    health: "bg-red-500",
    relationship: "bg-pink-500",
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!analyticsData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Error loading analytics</div>
        </div>
      </DashboardLayout>
    )
  }

  const { totalDecisions, successRate, avgConfidence, thisWeek, thisMonth, categoryStats, confidenceBreakdown, outcomesByConfidence, weeklyTrend, monthlyTrend, suggestions } = analyticsData

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
              <p className="text-gray-400">Insights into your decision-making patterns</p>
            </div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnalyticsCard
              title="Total Decisions"
              value={totalDecisions}
              subtitle="All time"
              trend={12}
              color="blue"
            />
            <AnalyticsCard
              title="Success Rate"
              value={`${successRate}%`}
              subtitle="Positive outcomes"
              trend={5}
              color="green"
            />
            <AnalyticsCard
              title="Avg Confidence"
              value={`${avgConfidence}%`}
              subtitle="Decision confidence"
              trend={-2}
              color="yellow"
            />
            <AnalyticsCard
              title={timeRange === "week" ? "This Week" : "This Month"}
              value={timeRange === "week" ? thisWeek : thisMonth}
              subtitle="New decisions"
              trend={15}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Decision Trend Chart */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Decision Trend</h3>
              <div className="space-y-4">
                <div className="flex items-end justify-between h-32 space-x-2">
                  {weeklyTrend.map((value, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-blue-500 rounded-t-lg transition-all duration-300 hover:bg-blue-400"
                        style={{ height: `${(value / Math.max(...weeklyTrend || [1])) * 100}%` }}
                      ></div>
                      <span className="text-gray-400 text-xs mt-2">
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-gray-400 text-sm">Decisions per day (last 7 days)</span>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Category Distribution</h3>
              <div className="space-y-4">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const percentage = Math.round((count / totalDecisions) * 100)
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${categoryColors[category]}`}></div>
                            <span className="text-gray-300 capitalize">{category}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 text-sm">{percentage}%</span>
                            <span className="text-white font-medium">{count}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-[#0d0d0d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${categoryColors[category]}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Confidence Analysis */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Confidence Analysis</h3>
              <div className="space-y-6">
                {Object.entries(outcomesByConfidence).map(([confidence, outcomes]) => {
                  const total = outcomes.positive + outcomes.neutral + outcomes.negative
                  const successRate = total > 0 ? Math.round((outcomes.positive / total) * 100) : 0

                  return (
                    <div key={confidence} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 capitalize font-medium">{confidence} Confidence</span>
                        <span className="text-white">{successRate}% success</span>
                      </div>
                      <div className="flex h-4 rounded-full overflow-hidden bg-[#0d0d0d]">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(outcomes.positive / total) * 100 || 0}%` }}
                          title={`${outcomes.positive} positive`}
                        ></div>
                        <div
                          className="bg-yellow-500"
                          style={{ width: `${(outcomes.neutral / total) * 100 || 0}%` }}
                          title={`${outcomes.neutral} neutral`}
                        ></div>
                        <div
                          className="bg-red-500"
                          style={{ width: `${(outcomes.negative / total) * 100 || 0}%` }}
                          title={`${outcomes.negative} negative`}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{outcomes.positive} positive</span>
                        <span>{outcomes.neutral} neutral</span>
                        <span>{outcomes.negative} negative</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Monthly Progress */}
            <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-6">Monthly Progress</h3>
              <div className="space-y-4">
                <div className="flex items-end justify-between h-40 space-x-3">
                  {monthlyTrend.map((value, index) => (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div
                        className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-lg transition-all duration-300 hover:from-purple-500 hover:to-purple-300"
                        style={{ height: `${(value / Math.max(...monthlyTrend || [1])) * 100}%` }}
                      ></div>
                      <span className="text-gray-400 text-xs mt-2">
                        {["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <span className="text-gray-400 text-sm">Decisions per month (last 6 months)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights Section */}
          <div className="mt-8 bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-[#0d0d0d] rounded-xl p-4 border border-gray-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-blue-400 font-medium">Suggestion</span>
                  </div>
                  <p className="text-gray-300 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}