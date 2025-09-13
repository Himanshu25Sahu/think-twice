import User from "../models/UserModel.js";
import analyticsController from "./analyticsController.js";
import dotenv from 'dotenv'
dotenv.config();

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId)
      .select('-passwordHash -otp -__v')
      .populate({
        path: 'decisions',
        select: 'title category confidenceLevel outcome reflection createdAt options user',
        options: { sort: { createdAt: -1 }, limit: 100 },
        populate: {
          path: 'user',
          select: 'name avatar'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const decisions = user.decisions || [];
    const { totalDecisions, successRate, avgConfidence, thisWeek, thisMonth } = analyticsController.calculateBasicStats(decisions);
    const categoryStats = analyticsController.calculateCategoryStats(decisions);
    const confidenceBreakdown = analyticsController.calculateConfidenceBreakdown(decisions);
    const outcomesByConfidence = analyticsController.calculateOutcomesByConfidence(decisions);
    const { weeklyTrend, monthlyTrend } = analyticsController.calculateTrends(decisions);
    const suggestions = analyticsController.generateSuggestions(decisions);

    const analyticsData = {
      totalDecisions,
      successRate,
      avgConfidence,
      thisWeek,
      thisMonth,
      categoryStats,
      confidenceBreakdown,
      outcomesByConfidence,
      weeklyTrend,
      monthlyTrend,
      suggestions
    };

    res.status(200).json({
      success: true,
      data: analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching analytics",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};