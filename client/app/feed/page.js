"use client";
import { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import DecisionCard from "../../components/ui/DecisionCard";
import QuickDecisionEntry from "../../components/ui/QuickDecisionEntry";
import { decisionService } from "../../services/decisionService";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";

export default function FeedPage() {
  const [decisions, setDecisions] = useState([]);
  const [filteredDecisions, setFilteredDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const { userData } = useSelector((state) => state.user);
  const router = useRouter();

  // 🔒 Protect route: redirect if not logged in
  useEffect(() => {
    if (!userData) {
      router.replace("/login");
    }
  }, [userData, router]);

  useEffect(() => {
    if (userData) {
      fetchPublicDecisions();
    }
  }, [userData]);

  const fetchPublicDecisions = async () => {
    try {
      setLoading(true);
      const response = await decisionService.getPublicDecisions();
      const decisionsWithIds = response.data.decisions.map((decision) => ({
        ...decision,
        likes: decision.likes?.map((like) => like._id) || [],
        comments: decision.comments || [],
      }));
      setDecisions(decisionsWithIds);
      setFilteredDecisions(decisionsWithIds);
    } catch (error) {
      console.error("Error fetching public decisions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewDecision = async (newDecision) => {
    try {
      const response = await decisionService.createDecision(newDecision);
      if (response.success) {
        const updatedDecisions = [
          { ...response.data.decision, likes: [], comments: [] },
          ...decisions,
        ];
        setDecisions(updatedDecisions);
        applyFilters(updatedDecisions, activeFilter, sortBy);
      }
    } catch (error) {
      console.error("Error creating decision:", error);
    }
  };

  const applyFilters = (decisionsToFilter, filter, sort) => {
    let filtered = [...decisionsToFilter];

    if (filter !== "all") {
      filtered = filtered.filter((decision) => decision.category === filter);
    }

    if (sort === "recent") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sort === "popular") {
      filtered.sort(
        (a, b) =>
          (b.likes?.length || 0) +
          (b.comments?.length || 0) -
          (a.likes?.length || 0) -
          (a.comments?.length || 0)
      );
    } else if (sort === "confidence") {
      filtered.sort(
        (a, b) => (b.confidenceLevel || 0) - (a.confidenceLevel || 0)
      );
    }

    setFilteredDecisions(filtered);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(decisions, filter, sortBy);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    applyFilters(decisions, activeFilter, sort);
  };

  const handleLike = async (decisionId) => {
    if (!userData?._id) return; // ✅ Guard when userData is null
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
        setFilteredDecisions((prev) =>
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

  const categories = [
    { key: "all", label: "All", count: decisions.length },
    { key: "career", label: "Career", count: decisions.filter((d) => d.category === "career").length },
    { key: "personal", label: "Personal", count: decisions.filter((d) => d.category === "personal").length },
    { key: "financial", label: "Financial", count: decisions.filter((d) => d.category === "financial").length },
    { key: "health", label: "Health", count: decisions.filter((d) => d.category === "health").length },
    { key: "relationships", label: "Relationship", count: decisions.filter((d) => d.category === "relationships").length },
  ];

  // 🚫 Prevent render if redirecting
  if (!userData) return null;

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
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 p-2 sm:p-4 md:p-6">
        {/* Main Feed */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Community Feed</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Discover decisions from the community and share your own
            </p>
          </div>

          <QuickDecisionEntry onSubmit={handleNewDecision} />

          {/* Filters and Sort */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
              <span className="text-gray-400 text-xs sm:text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-[#1a1a1a] border border-gray-700 rounded-lg px-2 py-1 sm:px-3 sm:py-2 text-white text-xs sm:text-sm w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="popular">Most Popular</option>
                <option value="confidence">Highest Confidence</option>
              </select>
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              {filteredDecisions.length} decision
              {filteredDecisions.length !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Decision Feed */}
          <div className="space-y-4 sm:space-y-6">
            {filteredDecisions.map((decision) => (
              <DecisionCard
                key={decision._id}
                decision={decision}
                onLike={() => handleLike(decision._id)}
                isLiked={decision.likes?.includes(userData?._id) || false} // ✅ safe check
              />
            ))}

            {filteredDecisions.length === 0 && (
              <div className="text-center py-6 sm:py-12">
                <div className="w-12 sm:w-16 h-12 sm:h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                  <svg
                    className="w-6 sm:w-8 h-6 sm:h-8 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2">
                  No decisions found
                </h3>
                <p className="text-gray-400 text-xs sm:text-base">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Filters */}
        <div className="w-full lg:w-80 p-2 sm:p-4 border-t lg:border-t-0 lg:border-l border-gray-800">
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.key}
                    onClick={() => handleFilterChange(category.key)}
                    className={`w-full flex items-center justify-between px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200 ${
                      activeFilter === category.key
                        ? "bg-blue-600 text-white"
                        : "bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#2a2a2a]"
                    }`}
                  >
                    <span className="font-medium text-xs sm:text-base">
                      {category.label}
                    </span>
                    <span className="text-xs sm:text-sm opacity-75">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg sm:rounded-2xl p-2 sm:p-4 border border-gray-800">
              <h4 className="text-white font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                Community Guidelines
              </h4>
              <ul className="text-gray-400 text-xs sm:text-sm space-y-1">
                <li>• Be respectful and constructive</li>
                <li>• Share genuine decisions</li>
                <li>• Provide helpful feedback</li>
                <li>• Respect privacy</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
