import Decision from "../models/DecisionModel.js";
import User from "../models/UserModel.js";
import mongoose from "mongoose";
import { redisClient } from "../utils/redisClient.js";
import dotenv from 'dotenv'
dotenv.config();

// Validation middleware for create
const validateDecisionInput = (req, res, next) => {
  const {
    title,
    description,
    category,
    options,
    reviewDate,
    confidenceLevel,
    expectedOutcome,
    isPublic,
    seekingAdvice,
    tags
  } = req.body;

  const errors = [];

  if (!title || title.trim().length === 0) {
    errors.push("Title is required");
  } else if (title.length > 100) {
    errors.push("Title cannot exceed 100 characters");
  }

  if (!description || description.trim().length === 0) {
    errors.push("Description is required");
  } else if (description.length > 1000) {
    errors.push("Description cannot exceed 1000 characters");
  }

  if (!category) {
    errors.push("Category is required");
  } else {
    const validCategories = ["career", "finance", "health", "personal", "education", "relationships", "other"];
    if (!validCategories.includes(category)) {
      errors.push("Invalid category");
    }
  }

  if (!options || !Array.isArray(options) || options.length < 2) {
    errors.push("At least two options are required");
  } else {
    options.forEach((option, index) => {
      if (!option.title || option.title.trim().length === 0) {
        errors.push(`Option ${index + 1}: title is required`);
      }
      if (option.pros !== undefined && !Array.isArray(option.pros)) {
        errors.push(`Option ${index + 1}: pros must be an array`);
      }
      if (option.cons !== undefined && !Array.isArray(option.cons)) {
        errors.push(`Option ${index + 1}: cons must be an array`);
      }
    });
  }

  if (!reviewDate) {
    errors.push("Review date is required");
  } else {
    const reviewDateObj = new Date(reviewDate);
    if (isNaN(reviewDateObj.getTime())) {
      errors.push("Invalid review date format");
    } else if (reviewDateObj <= new Date()) {
      errors.push("Review date must be in the future");
    }
  }

  if (confidenceLevel !== undefined) {
    if (typeof confidenceLevel !== 'number' || isNaN(confidenceLevel)) {
      errors.push("Confidence level must be a number");
    } else if (confidenceLevel < 0 || confidenceLevel > 100) {
      errors.push("Confidence level must be between 0 and 100");
    }
  }

  if (expectedOutcome !== undefined && typeof expectedOutcome !== 'string') {
    errors.push("Expected outcome must be a string");
  } else if (expectedOutcome && expectedOutcome.length > 500) {
    errors.push("Expected outcome cannot exceed 500 characters");
  }

  if (isPublic !== undefined && typeof isPublic !== 'boolean') {
    errors.push("isPublic must be a boolean");
  }

  if (seekingAdvice !== undefined && typeof seekingAdvice !== 'boolean') {
    errors.push("seekingAdvice must be a boolean");
  }

  if (tags !== undefined) {
    if (!Array.isArray(tags)) {
      errors.push("Tags must be an array");
    } else {
      tags.forEach((tag, index) => {
        if (typeof tag !== 'string') {
          errors.push(`Tag ${index + 1}: must be a string`);
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors
    });
  }

  next();
};

// Create a new decision
// Create a new decision
export const createDecision = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      confidenceLevel = 50,
      options,
      expectedOutcome,
      reviewDate,
      isPublic = false,
      seekingAdvice = false,
      tags = [],
      poll = { enabled: false } // Default poll to disabled if not provided
    } = req.body;

    // Extra safety check (though validation should catch)
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least two options are required"
      });
    }

    // Validate poll
    if (poll.enabled && !isPublic) {
      return res.status(400).json({
        success: false,
        message: "Poll can only be enabled for public decisions"
      });
    }

    const decision = new Decision({
      title: title.trim(),
      description: description.trim(),
      category,
      user: req.user._id,
      confidenceLevel,
      options: options.map(opt => ({
        title: opt.title.trim(),
        pros: Array.isArray(opt.pros) ? opt.pros.map(p => typeof p === 'string' ? p.trim() : '').filter(p => p) : [],
        cons: Array.isArray(opt.cons) ? opt.cons.map(c => typeof c === 'string' ? c.trim() : '').filter(c => c) : []
      })),
      expectedOutcome: expectedOutcome ? expectedOutcome.trim() : undefined,
      reviewDate: new Date(reviewDate),
      isPublic,
      seekingAdvice,
      tags: Array.isArray(tags) ? tags.map(tag => typeof tag === 'string' ? tag.trim() : '').filter(tag => tag) : [],
      poll: {
        enabled: isPublic && poll.enabled // Only enable poll if public and requested
      }
    });

    const savedDecision = await decision.save();
    
    // Add decision to user's decisions array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { decisions: savedDecision._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Decision created successfully",
      data: {
        decision: savedDecision
      }
    });
  } catch (error) {
    console.error(error); // Log for debugging
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error creating decision",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get my decisions (both public and private)
// Get my decisions (both public and private)
export const getMyDecisions = async (req, res) => {
  const startTime = Date.now();

  try {
    const { page = 1, limit = 10, category, reviewed, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const userId = req.user._id;

    const filter = { user: userId };

    if (category && category !== "all") filter.category = category;
    if (reviewed !== undefined) filter.isReviewed = reviewed === "true";

    const validSortFields = ['createdAt', 'updatedAt', 'reviewDate', 'confidenceLevel', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortOptions = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

    const options = {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(50, Math.max(1, parseInt(limit))),
      sort: sortOptions,
      populate: [
        { path: "user", select: "name avatar" },
        { path: "comments.user", select: "name avatar" }
      ]
    };

    // Unique cache key per user and query
    const cacheKey = `myDecisions:${userId}:${page}:${limit}:${category || "all"}:${reviewed || "all"}:${sortBy}:${sortOrder}`;

    // 1️⃣ Try Redis cache
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const elapsed = Date.now() - startTime;
      console.log(`⚡ Cache hit (${elapsed}ms)`);
      return res.status(200).json(JSON.parse(cached));
    }

    // 2️⃣ Cache miss → fetch from MongoDB
    const decisions = await Decision.paginate(filter, options);

    const response = {
      success: true,
      data: {
        decisions: decisions.docs,
        pagination: {
          page: decisions.page,
          limit: decisions.limit,
          totalPages: decisions.totalPages,
          totalDocs: decisions.totalDocs,
          hasNext: decisions.hasNextPage,
          hasPrev: decisions.hasPrevPage
        }
      }
    };

    // 3️⃣ Save to Redis **async**, 60s expiry
    redisClient
      .set(cacheKey, JSON.stringify(response), { EX: 60 })
      .catch(err => console.error("❌ Redis set error:", err));

    const elapsed = Date.now() - startTime;
    console.log(`🕓 Cache miss (${elapsed}ms) — serving response immediately`);

    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ Error in getMyDecisions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching my decisions",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


// Update a decision
export const getDecision = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID"
      });
    }

    const decision = await Decision.findById(id)
      .populate("user", "name avatar")
      .populate("likes", "name avatar")
      .populate("comments.user", "name avatar")
      .populate("poll.votes.user", "name avatar");  // Populate voters if needed

    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (!decision.isPublic && decision.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this decision"
      });
    }

    // Include vote counts in response
    const responseData = decision.toObject({ virtuals: true });

    res.status(200).json({
      success: true,
      data: {
        decision: responseData
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching decision",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Updated updateDecision to prevent changing options if poll is enabled
export const updateDecision = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (decision.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this decision"
      });
    }

    const updateData = { ...req.body };

    // Prevent updating options if poll is enabled
    if (updateData.options && decision.poll.enabled) {
      return res.status(400).json({
        success: false,
        message: "Cannot update options after poll is enabled"
      });
    }

    // ... (rest of the existing updateDecision code remains the same, including validations)

    const updatedDecision = await Decision.findByIdAndUpdate(
      id,
      { $set: updateData },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).populate("user", "name avatar");

    res.status(200).json({
      success: true,
      message: "Decision updated successfully",
      data: {
        decision: updatedDecision
      }
    });
  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error updating decision",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get user's decisions
export const getUserDecisions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, category, reviewed, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    const filter = { user: userId };
    const isOwnDecisions = userId === req.user._id.toString();

    if (!isOwnDecisions) {
      filter.isPublic = true;
    }

    if (category && category !== "all") {
      filter.category = category;
    }
    
    if (reviewed !== undefined) {
      filter.isReviewed = reviewed === "true";
    }

    const sortOptions = {};
    const validSortFields = ['createdAt', 'updatedAt', 'reviewDate', 'confidenceLevel', 'title'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    sortOptions[sortField] = sortOrder === 'asc' ? 1 : -1;

    const options = {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(50, Math.max(1, parseInt(limit))),
      sort: sortOptions,
      populate: { path: "user", select: "name avatar" }
    };

    const decisions = await Decision.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: {
        decisions: decisions.docs,
        pagination: {
          page: decisions.page,
          limit: decisions.limit,
          totalPages: decisions.totalPages,
          totalDocs: decisions.totalDocs,
          hasNext: decisions.hasNextPage,
          hasPrev: decisions.hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching decisions",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get public decisions
// Get public decisions
// Get public decisions
export const getPublicDecisions = async (req, res) => {
  const startTime = Date.now(); // measure timing

  try {
    const { page = 1, limit = 10, category, sortBy = "createdAt", sortOrder = "desc" } = req.query;

    const filter = { isPublic: true };
    if (category && category !== "all") filter.category = category;

    const validSortFields = ["createdAt", "updatedAt", "likeCount", "commentCount"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortOptions = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const options = {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(50, Math.max(1, parseInt(limit))),
      sort: sortOptions,
      populate: [
        { path: "user", select: "name avatar" },
        { path: "likes", select: "_id" },
        { path: "comments.user", select: "name avatar" },
      ],
    };

    const cacheKey = `publicDecisions:${page}:${limit}:${category || "all"}:${sortBy}:${sortOrder}`;

    // Try Redis cache first
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      const elapsed = Date.now() - startTime;
      console.log(`⚡ Cache hit (${elapsed}ms)`);
      return res.status(200).json(JSON.parse(cached));
    }

    // Cache miss → fetch from MongoDB
    const decisions = await Decision.paginate(filter, options);

    const response = {
      success: true,
      data: {
        decisions: decisions.docs,
        pagination: {
          page: decisions.page,
          limit: decisions.limit,
          totalPages: decisions.totalPages,
          totalDocs: decisions.totalDocs,
          hasNext: decisions.hasNextPage,
          hasPrev: decisions.hasPrevPage,
        },
      },
    };

    const elapsed = Date.now() - startTime;
    console.log(`🕓 Cache miss (${elapsed}ms) — serving response immediately`);

    // Save to Redis **async**, no await → first load not delayed
    redisClient
      .set(cacheKey, JSON.stringify(response), { EX: 60 })
      .catch((err) => console.error("❌ Redis set error:", err));

    return res.status(200).json(response);

  } catch (error) {
    console.error("❌ Error in getPublicDecisions:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching public decisions",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error",
    });
  }
};


// Delete a decision
export const deleteDecision = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (decision.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this decision"
      });
    }

    await Decision.findByIdAndDelete(id);
    await User.findByIdAndUpdate(req.user._id, { $pull: { decisions: id } });

    res.status(200).json({
      success: true,
      message: "Decision deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting decision",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Like/unlike a decision
// Like/unlike a decision
export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (!decision.isPublic && decision.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to like this decision"
      });
    }

    const hasLiked = decision.likes.includes(req.user._id);
    let updatedDecision;

    if (hasLiked) {
      updatedDecision = await Decision.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user._id } },
        { new: true }
      );
    } else {
      updatedDecision = await Decision.findByIdAndUpdate(
        id,
        { $addToSet: { likes: req.user._id } },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: hasLiked ? "Decision unliked" : "Decision liked",
      data: {
        liked: !hasLiked,
        likeCount: updatedDecision.likes.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error toggling like",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
// Add a comment
export const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID"
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required"
      });
    }

    if (text.trim().length > 300) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 300 characters"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (!decision.isPublic && decision.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to comment on this decision"
      });
    }

    const comment = {
      user: req.user._id,
      text: text.trim()
    };

    const updatedDecision = await Decision.findByIdAndUpdate(
      id,
      { $push: { comments: comment } },
      { new: true }
    ).populate("comments.user", "name avatar");

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      data: {
        comments: updatedDecision.comments
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get decisions for review
export const getDecisionsForReview = async (req, res) => {
  try {
    const { daysThreshold = 7, page = 1, limit = 10 } = req.query;

    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - parseInt(daysThreshold));

    const filter = {
      user: req.user._id,
      isReviewed: false,
      reviewDate: { $lte: new Date() }
    };

    const options = {
      page: Math.max(1, parseInt(page)),
      limit: Math.min(50, Math.max(1, parseInt(limit))),
      sort: { reviewDate: 1 },
      populate: { path: "user", select: "name avatar" }
    };

    const decisions = await Decision.paginate(filter, options);

    res.status(200).json({
      success: true,
      data: {
        decisions: decisions.docs,
        pagination: {
          page: decisions.page,
          limit: decisions.limit,
          totalPages: decisions.totalPages,
          totalDocs: decisions.totalDocs,
          hasNext: decisions.hasNextPage,
          hasPrev: decisions.hasPrevPage
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching review decisions",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get decision analytics
export const getDecisionAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID"
      });
    }

    if (userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view these analytics"
      });
    }

    const decisions = await Decision.find({ user: userId });
    const reviewedDecisions = decisions.filter(d => d.isReviewed);

    // Category statistics
    const categoryStats = {};
    decisions.forEach(d => {
      categoryStats[d.category] = (categoryStats[d.category] || 0) + 1;
    });

    // Success rate by category
    const successByCategory = {};
    reviewedDecisions.forEach(d => {
      if (!successByCategory[d.category]) {
        successByCategory[d.category] = { total: 0, successful: 0 };
      }
      successByCategory[d.category].total++;
      if (d.successRating >= 4) {
        successByCategory[d.category].successful++;
      }
    });

    // Confidence vs success correlation (simple calculation)
    let confidenceSuccessCorrelation = 0;
    if (reviewedDecisions.length > 0) {
      const avgConfidence = reviewedDecisions.reduce((sum, d) => sum + d.confidenceLevel, 0) / reviewedDecisions.length;
      const avgSuccess = reviewedDecisions.reduce((sum, d) => sum + (d.successRating || 3), 0) / reviewedDecisions.length;
      confidenceSuccessCorrelation = Math.min(100, (avgSuccess / 5) * (avgConfidence / 100) * 100);
    }

    // Monthly trends
    const monthlyData = {};
    decisions.forEach(d => {
      const monthYear = d.createdAt.toISOString().substring(0, 7); // YYYY-MM
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { total: 0, reviewed: 0, successful: 0 };
      }
      monthlyData[monthYear].total++;
      if (d.isReviewed) {
        monthlyData[monthYear].reviewed++;
        if (d.successRating >= 4) {
          monthlyData[monthYear].successful++;
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        analytics: {
          totalDecisions: decisions.length,
          reviewedDecisions: reviewedDecisions.length,
          reviewRate: decisions.length > 0 ? (reviewedDecisions.length / decisions.length) * 100 : 0,
          successRate: reviewedDecisions.length > 0
            ? (reviewedDecisions.filter(d => d.successRating >= 4).length / reviewedDecisions.length) * 100
            : 0,
          confidenceSuccessCorrelation,
          categoryStats,
          successByCategory,
          monthlyData
        }
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete a comment
export const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision or comment ID"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    const comment = decision.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    // Allow comment author or decision owner to delete
    if (comment.user.toString() !== req.user._id.toString() && 
        decision.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment"
      });
    }

    comment.deleteOne();
    await decision.save();

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error deleting comment",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const enablePoll = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision ID"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (decision.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to enable poll for this decision"
      });
    }

    if (!decision.isPublic) {
      return res.status(400).json({
        success: false,
        message: "Poll can only be enabled for public decisions"
      });
    }

    if (decision.poll.enabled) {
      return res.status(400).json({
        success: false,
        message: "Poll is already enabled"
      });
    }

    decision.poll.enabled = true;
    const updatedDecision = await decision.save();

    res.status(200).json({
      success: true,
      message: "Poll enabled successfully",
      data: {
        decision: updatedDecision
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error enabling poll",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Vote on a poll
// Vote on a poll
export const votePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;

    console.log('Vote request received:', { decisionId: id, optionId, userId: req.user._id });

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(optionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid decision or option ID"
      });
    }

    const decision = await Decision.findById(id);
    if (!decision) {
      return res.status(404).json({
        success: false,
        message: "Decision not found"
      });
    }

    if (!decision.isPublic || !decision.poll.enabled) {
      return res.status(403).json({
        success: false,
        message: "Poll is not enabled or decision is not public"
      });
    }

    // Check if option exists
    const optionExists = decision.options.some(opt => opt._id.toString() === optionId);
    if (!optionExists) {
      return res.status(400).json({
        success: false,
        message: "Invalid option ID"
      });
    }

    // Find existing vote for user
    const existingVoteIndex = decision.poll.votes.findIndex(
      vote => vote.user.toString() === req.user._id.toString()
    );

    if (existingVoteIndex !== -1) {
      // Update existing vote
      decision.poll.votes[existingVoteIndex].optionId = optionId;
    } else {
      // Add new vote
      decision.poll.votes.push({
        user: req.user._id,
        optionId: optionId
      });
    }

    const updatedDecision = await decision.save();

    // Calculate vote counts for response
    const voteCounts = {};
    decision.options.forEach(option => {
      voteCounts[option._id] = updatedDecision.poll.votes.filter(
        vote => vote.optionId.toString() === option._id.toString()
      ).length;
    });

    res.status(200).json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        voteCounts: voteCounts,
        userVote: optionId
      }
    });
  } catch (error) {
    console.error('Vote error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already voted"
      });
    }
    res.status(500).json({
      success: false,
      message: "Error voting on poll",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};