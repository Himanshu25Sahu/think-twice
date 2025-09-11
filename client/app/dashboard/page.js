"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionCard from "../../components/ui/DecisionCard";

import AnalyticsCard from "../../components/ui/AnalyticsCard";
import { decisionService } from "../../services/decisionService";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const QuickDecisionEntry = dynamic(() => import("../../components/ui/QuickDecisionEntry"), { ssr: false });

export default function DashboardPage() {
  const [decisions, setDecisions] = useState([]);
  const [filteredDecisions, setFilteredDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [stats, setStats] = useState({
    totalDecisions: 0,
    avgConfidence: 0,
    thisWeek: 0,
    categoryStats: {},
    confidenceDistribution: { low: 0, medium: 0, high: 0 },
  });

  const { userData } = useSelector((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!userData) {
      router.replace("/login");
    } else {
      fetchDashboardData();
    }
  }, [userData, router]);

  useEffect(() => {
    if (selectedCategory === "All Categories") {
      setFilteredDecisions(decisions);
    } else {
      setFilteredDecisions(decisions.filter((d) => d.category === selectedCategory.toLowerCase()));
    }
  }, [decisions, selectedCategory]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [decisionsResponse, analyticsResponse] = await Promise.all([
        decisionService.getMyDecisions({ limit: 10 }),
        userData ? decisionService.getAnalytics(userData._id) : Promise.resolve(null),
      ]);

      const decisionsData = decisionsResponse?.data?.decisions || [];
      setDecisions(decisionsData);
      setFilteredDecisions(decisionsData);

      if (analyticsResponse) {
        const { analytics } = analyticsResponse.data;
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        setStats({
          totalDecisions: analytics.totalDecisions || 0,
          avgConfidence: analytics.confidenceSuccessCorrelation || 0,
          thisWeek: decisionsData.filter((d) => new Date(d.createdAt) >= startOfWeek).length,
          categoryStats: analytics.categoryStats || {},
          confidenceDistribution: {
            low: decisionsData.filter((d) => d.confidenceLevel < 40).length,
            medium: decisionsData.filter((d) => d.confidenceLevel >= 40 && d.confidenceLevel < 70).length,
            high: decisionsData.filter((d) => d.confidenceLevel >= 70).length,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewDecision = async (newDecision) => {
    try {
      const response = await decisionService.createDecision(newDecision);
      if (response.success) {
        setDecisions([response.data.decision, ...decisions]);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error creating decision:", error);
    }
  };

  const handleLike = async (decisionId) => {
    if (!userData?._id) return;
    try {
      const response = await decisionService.toggleLike(decisionId);
      if (response.success) {
        setDecisions((prev) =>
          prev.map((decision) =>
            decision._id === decisionId
              ? {
                  ...decision,
                  likes: response.data.liked
                    ? [...(decision.likes || []), userData._id]
                    : decision.likes.filter((id) => id !== userData._id),
                  likeCount: response.data.likeCount,
                }
              : decision
          )
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  if (!userData) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex-1 min-w-0">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Dashboard</h1>
              <p className="text-gray-400 text-sm sm:text-base">Track your decisions and build better judgment</p>
            </div>
            <QuickDecisionEntry onSubmit={handleNewDecision} />
            <div className="space-y-6 mt-6 sm:mt-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white">Your Recent Decisions</h2>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>All Categories</option>
                  <option>Career</option>
                  <option>Personal</option>
                  <option>Financial</option>
                  <option>Health</option>
                  <option>Relationship</option>
                </select>
              </div>
              {filteredDecisions.length > 0 ? (
                filteredDecisions.map((decision) => (
                  <DecisionCard
                    key={decision._id}
                    decision={decision}
                    onLike={() => handleLike(decision._id)}
                    isLiked={decision.likes?.includes(userData._id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-2">No decisions yet</h3>
                  <p className="text-gray-400 text-sm sm:text-base">Start by sharing your first decision above</p>
                </div>
              )}
            </div>
          </div>
          <div className="w-full lg:w-80 p-4 sm:p-6 border-t lg:border-t-0 lg:border-l border-gray-800">
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <AnalyticsCard title="Total Decisions" value={stats.totalDecisions} subtitle="All time" trend={12} color="blue" />
                  <AnalyticsCard title="Confidence Score" value={`${Math.round(stats.avgConfidence)}%`} subtitle="Average confidence" trend={5} color="green" />
                  <AnalyticsCard title="This Week" value={stats.thisWeek} subtitle="New decisions" trend={-8} color="yellow" />
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Categories</h3>
                <div className="space-y-3">
                  {Object.entries(stats.categoryStats).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-gray-300 capitalize text-sm sm:text-base">{category}</span>
                      <span className="text-gray-500 text-sm sm:text-base">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Confidence Levels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm sm:text-base">High</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 sm:w-24 h-2 bg-[#0d0d0d] rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${stats.totalDecisions ? (stats.confidenceDistribution.high / stats.totalDecisions) * 100 : 0}%` }}></div>
                      </div>
                      <span className="text-gray-500 text-sm">{stats.confidenceDistribution.high}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm sm:text-base">Medium</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 sm:w-24 h-2 bg-[#0d0d0d] rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${stats.totalDecisions ? (stats.confidenceDistribution.medium / stats.totalDecisions) * 100 : 0}%` }}></div>
                      </div>
                      <span className="text-gray-500 text-sm">{stats.confidenceDistribution.medium}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm sm:text-base">Low</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 sm:w-24 h-2 bg-[#0d0d0d] rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.totalDecisions ? (stats.confidenceDistribution.low / stats.totalDecisions) * 100 : 0}%` }}></div>
                      </div>
                      <span className="text-gray-500 text-sm">{stats.confidenceDistribution.low}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-gray-800">
                <h4 className="text-white font-medium mb-2 text-sm sm:text-base">Decision Tip</h4>
                <p className="text-gray-400 text-sm">Consider writing down the potential outcomes of each option to clarify your thinking process.</p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </DashboardLayout>
  );
}