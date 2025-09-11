"use client"
import { useState, useEffect } from "react"
import DashboardLayout from "../../components/layout/DashboardLayout"
import DecisionCard from "../../components/ui/DecisionCard"
import AnalyticsCard from "../../components/ui/AnalyticsCard"
import Button from "../../components/ui/Button"
import { userService } from "../../services/userService"
import { useSelector } from "react-redux"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("decisions")
  const [isEditing, setIsEditing] = useState(false)
  const [editedBio, setEditedBio] = useState("")
  const [loading, setLoading] = useState(true)
  const [profileData, setProfileData] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const decisionsPerPage = 5
  const { userData } = useSelector((state) => state.user)

  useEffect(() => {
    fetchProfileData()
  }, [])

  const fetchProfileData = async () => {
    try {
      setLoading(true)
      const response = await userService.getMyProfile()
      console.log("Profile Data:", response.data); // Debug log
      setProfileData(response.data)
      setEditedBio(response.data.user.bio || "")
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveBio = async () => {
    try {
      await userService.updateProfile({ bio: editedBio })
      setIsEditing(false)
      fetchProfileData()
    } catch (error) {
      console.error("Error updating bio:", error)
    }
  }

  // Pagination logic
  const indexOfLastDecision = currentPage * decisionsPerPage
  const indexOfFirstDecision = indexOfLastDecision - decisionsPerPage
  const currentDecisions = profileData?.recentDecisions?.slice(indexOfFirstDecision, indexOfLastDecision)
  const totalPages = profileData ? Math.ceil(profileData.recentDecisions.length / decisionsPerPage) : 1

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber)
    window.scrollTo({ top: 0, behavior: "smooth" })
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

  if (!profileData) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-white">Error loading profile</div>
        </div>
      </DashboardLayout>
    )
  }

  const { user, stats } = profileData

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 border border-gray-800 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white text-xl sm:text-2xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">@{user.username}</h1>
                    <p className="text-gray-400 text-sm sm:text-base">{user.email}</p>
                  </div>
                </div>

                {/* Bio */}
                <div className="mb-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        value={editedBio}
                        onChange={(e) => setEditedBio(e.target.value)}
                        className="w-full bg-[#0d0d0d] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm sm:text-base"
                        rows={3}
                        placeholder="Tell us about yourself..."
                      />
                      <Button onClick={handleSaveBio}>Save Bio</Button>
                    </div>
                  ) : (
                    <p className="text-gray-300 text-sm sm:text-base">{user.bio || "No bio yet."}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <span className="block text-white font-semibold">{user.followers}</span>
                    <span className="text-gray-400">Followers</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-white font-semibold">{user.following}</span>
                    <span className="text-gray-400">Following</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-white font-semibold">{stats.totalDecisions}</span>
                    <span className="text-gray-400">Decisions</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-white font-semibold">Joined {user.joinedDate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <AnalyticsCard
              title="Success Rate"
              value={`${stats.successRate}%`}
              subtitle="Positive outcomes"
              trend={8}
              color="green"
            />
            <AnalyticsCard
              title="Avg Confidence"
              value={`${stats.avgConfidence}%`}
              subtitle="Decision confidence"
              trend={-2}
              color="blue"
            />
            <AnalyticsCard
              title="This Month"
              value={stats.totalDecisions}
              subtitle="Total decisions"
              trend={15}
              color="purple"
            />
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 sm:gap-3 mb-6">
            <button
              onClick={() => setActiveTab("decisions")}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === "decisions"
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              }`}
            >
              Decision History
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                activeTab === "stats"
                  ? "bg-blue-600 text-white"
                  : "bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
              }`}
            >
              Detailed Stats
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "decisions" && (
            <div className="space-y-6">
              {currentDecisions?.length > 0 ? (
                <>
                  {currentDecisions.map((decision) => (
                    <div key={decision._id} className="relative">
                      <DecisionCard decision={decision} showInteractions={false} />
                      {decision.outcome && (
                        <div className="mt-4 bg-[#0d0d0d] rounded-xl p-4 border border-gray-800">
                          <div className="flex items-center space-x-2 mb-2">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                decision.outcome === "positive"
                                  ? "bg-green-500"
                                  : decision.outcome === "negative"
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                              }`}
                            ></div>
                            <span className="text-white font-medium">
                              Outcome: {decision.outcome.charAt(0).toUpperCase() + decision.outcome.slice(1)}
                            </span>
                          </div>
                          {decision.reflection && (
                            <p className="text-gray-300 text-sm sm:text-base">{decision.reflection}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Pagination Controls */}
                  <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg text-sm sm:text-base ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-[#1a1a1a] text-gray-400 hover:bg-[#2a2a2a] hover:text-white"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">No decisions yet</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Start making decisions to see them here</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Category Breakdown */}
              <div className="bg-[#1a1a1a] rounded-2xl p-4 sm:p-6 border border-gray-800">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Decision Categories</h3>
                <div className="space-y-4">
                  {Object.entries(stats.categoryStats).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize text-sm sm:text-base">{category}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 sm:w-32 h-2 bg-[#0d0d0d] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(count / stats.totalDecisions) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-500 text-sm w-8">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Confidence vs Outcome */}
              <div className="bg-[#1a1a1a] rounded-2xl p-4 sm:p-6 border border-gray-800">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Confidence vs Outcome</h3>
                <div className="space-y-4">
                  {Object.entries(stats.confidenceOutcomeStats).map(([confidence, data]) => {
                    const successRate = data.total > 0 ? Math.round((data.positive / data.total) * 100) : 0

                    return (
                      <div key={confidence} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 capitalize text-sm sm:text-base">{confidence} Confidence</span>
                          <span className="text-gray-500 text-sm">
                            {data.positive}/{data.total} ({successRate}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#0d0d0d] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              confidence === "high"
                                ? "bg-green-500"
                                : confidence === "medium"
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                            }`}
                            style={{ width: `${successRate}%` }}
                          ></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}