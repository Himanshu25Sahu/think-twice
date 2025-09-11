"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns"; // Add this import
import { decisionService } from "../../services/decisionService";

export default function DecisionCard({ decision, onLike, isLiked, showInteractions = true }) {
  const [currentDecision, setCurrentDecision] = useState(decision);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [voting, setVoting] = useState(false);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    setCurrentDecision(decision);
  }, [decision]);

  // Initialize hasVoted and userVote from the decision data
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [voteCounts, setVoteCounts] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userDataFromStorage = localStorage.getItem('userData');
      if (userDataFromStorage) {
        setUserData(JSON.parse(userDataFromStorage));
      }
    }
    if (userData && currentDecision.poll?.votes) {
      const userHasVoted = currentDecision.poll.votes.some(
        (vote) => vote.user && vote.user.toString() === userData._id
      );
      const userCurrentVote = currentDecision.poll.votes.find(
        (vote) => vote.user && vote.user.toString() === userData._id
      );

      setHasVoted(userHasVoted);
      setUserVote(userCurrentVote?.optionId);

      const counts = {};
      currentDecision.options.forEach((option) => {
        counts[option._id] = currentDecision.poll.votes.filter(
          (vote) => vote.optionId && vote.optionId.toString() === option._id.toString()
        ).length;
      });
      setVoteCounts(counts);
    }
  }, [currentDecision, userData]);

  const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);

  const handleVote = async (optionId) => {
    if (!currentDecision.poll?.enabled || voting || hasVoted || !userData) return;

    setVoting(true);
    try {
      const response = await decisionService.votePoll(currentDecision._id, optionId);
      if (response.success) {
        setVoteCounts(response.data.voteCounts || {});
        setHasVoted(true);
        setUserVote(optionId);
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert(error.response?.data?.message || "Failed to vote. Please try again.");
    } finally {
      setVoting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) {
      setCommentError("Comment cannot be empty");
      return;
    }
    if (commentText.trim().length > 300) {
      setCommentError("Comment cannot exceed 300 characters");
      return;
    }

    try {
      const response = await decisionService.addComment(currentDecision._id, commentText);
      if (response.success) {
        setCurrentDecision({
          ...currentDecision,
          comments: response.data.comments,
        });
        setCommentText("");
        setCommentError("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentError(error.response?.data?.message || "Failed to add comment");
    }
  };

  const confidenceColor = {
    low: "text-red-400 bg-red-400/10",
    medium: "text-yellow-400 bg-yellow-400/10",
    high: "text-green-400 bg-green-400/10",
  };

  const categoryColors = {
    career: "bg-blue-500/10 text-blue-400",
    personal: "bg-purple-500/10 text-purple-400",
    financial: "bg-green-500/10 text-green-400",
    health: "bg-red-500/10 text-red-400",
    relationship: "bg-pink-500/10 text-pink-400",
    relationships: "bg-pink-500/10 text-pink-400",
  };

  const getConfidenceLevel = (confidence) => {
    if (confidence >= 70) return "high";
    if (confidence >= 40) return "medium";
    return "low";
  };

  const confidenceLevel = getConfidenceLevel(currentDecision.confidenceLevel || 50);

  const handleImageError = (e) => {
    e.target.src = "/default-avatar.png";
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 hover:border-gray-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-gray-700">
            {currentDecision.user?.avatar ? (
              <img
                src={currentDecision.user.avatar}
                alt={currentDecision.user?.name || "User avatar"}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <span className="text-white font-medium text-sm">
                {currentDecision.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </span>
            )}
          </div>
          <div>
            <p className="text-white font-medium text-sm">
              {currentDecision.user?.name || "Unknown User"}
            </p>
            <p className="text-gray-500 text-xs">
              {format(new Date(currentDecision.createdAt), "MM/dd/yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              categoryColors[currentDecision.category] || "bg-gray-500/10 text-gray-400"
            }`}
          >
            {currentDecision.category}
          </span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              confidenceColor[confidenceLevel] || "bg-gray-500/10 text-gray-400"
            }`}
          >
            {confidenceLevel} confidence
          </span>
        </div>
      </div>
      <Link href={`/decisions/${currentDecision._id}`}>
        <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 transition-colors cursor-pointer">
          {currentDecision.title}
        </h3>
      </Link>
      <p className="text-gray-400 text-sm mb-4">
        {currentDecision.description}
      </p>
      {currentDecision.poll?.enabled && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-300 text-sm font-medium">Community Poll</p>
            {totalVotes > 0 && (
              <p className="text-gray-500 text-xs">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</p>
            )}
          </div>
          <div className="space-y-2">
            {currentDecision.options?.map((option) => {
              const voteCount = voteCounts[option._id] || 0;
              const percentage = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
              const isUserVote = userVote === option._id.toString();
              return (
                <div key={option._id} className="relative">
                  <button
                    onClick={() => handleVote(option._id)}
                    disabled={hasVoted || voting}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isUserVote
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-gray-600 hover:border-gray-500 bg-[#0d0d0d]"
                    } ${hasVoted || voting ? "cursor-default" : "cursor-pointer hover:bg-[#1a1a1a]"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isUserVote ? "text-blue-300" : "text-gray-300"}`}>
                        {option.title}
                      </span>
                      {hasVoted && (
                        <span className="text-xs text-gray-400">
                          {voteCount} ({Math.round(percentage)}%)
                        </span>
                      )}
                    </div>
                    {hasVoted && (
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
          {!hasVoted && !voting && (
            <p className="text-gray-500 text-xs mt-2 text-center">
              Click on an option to vote
            </p>
          )}
          {voting && (
            <p className="text-blue-400 text-xs mt-2 text-center">
              Recording your vote...
            </p>
          )}
          {hasVoted && (
            <p className="text-green-400 text-xs mt-2 text-center">
              ✓ You've voted in this poll
            </p>
          )}
        </div>
      )}
      <div className="mb-4">
        <p className="text-gray-500 text-xs mb-2">Options considered:</p>
        <div className="space-y-1">
          {currentDecision.options?.slice(0, 2).map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  option.chosen ? "bg-blue-500" : "bg-gray-600"
                }`}
              ></div>
              <span className="text-gray-400 text-sm">
                {option.title}
              </span>
            </div>
          ))}
          {currentDecision.options?.length > 2 && (
            <p className="text-gray-500 text-xs">
              +{currentDecision.options.length - 2} more options
            </p>
          )}
        </div>
      </div>
      {showInteractions && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-800">
          <div className="flex items-center space-x-4">
            <button
              onClick={onLike}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                isLiked ? "text-red-400" : "text-gray-400 hover:text-white"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span>{currentDecision.likes?.length || 0}</span>
            </button>
            <button
              onClick={() => setIsCommenting(!isCommenting)}
              className="flex items-center space-x-1 text-gray-400 hover:text-white text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span>{currentDecision.comments?.length || 0}</span>
            </button>
          </div>
          <button
            onClick={() => setIsBookmarked(!isBookmarked)}
            className={`p-1 rounded-md transition-colors ${
              isBookmarked
                ? "text-yellow-400 bg-yellow-400/10"
                : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={isBookmarked ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>
      )}
      {isCommenting && (
        <div className="mt-4">
          <div className="mb-4 max-h-64 overflow-y-auto">
            {currentDecision.comments?.length > 0 ? (
              currentDecision.comments.map((comment, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-[#2a2a2a] rounded-md mb-2"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-gray-700">
                    {comment.user?.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user?.name || "Commenter avatar"}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    ) : (
                      <span className="text-white font-medium text-xs">
                        {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">
                      {comment.user?.name || "Unknown User"}
                    </p>
                    <p className="text-gray-400 text-sm">{comment.text}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      {format(new Date(comment.createdAt), "MM/dd/yyyy")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No comments yet.</p>
            )}
          </div>
          <form onSubmit={handleCommentSubmit}>
            <textarea
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
                setCommentError("");
              }}
              placeholder="Add a comment..."
              className="w-full p-2 bg-[#2a2a2a] text-white rounded-md border border-gray-700 focus:outline-none focus:border-blue-400 text-sm"
              rows={3}
              maxLength={300}
            />
            {commentError && (
              <p className="text-red-400 text-xs mt-1">{commentError}</p>
            )}
            <div className="flex justify-end space-x-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsCommenting(false);
                  setCommentText("");
                  setCommentError("");
                }}
                className="text-gray-400 hover:text-white text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}