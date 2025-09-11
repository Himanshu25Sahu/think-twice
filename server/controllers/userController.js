import User from "../models/UserModel.js";

// Get my profile
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user with populated data
    const user = await User.findById(userId)
      .select('-passwordHash -otp -__v')
      .populate({
        path: 'decisions',
        select: 'title category confidenceLevel outcome reflection createdAt options user',
        options: { sort: { createdAt: -1 }, limit: 20 },
        populate: {
          path: 'user', // Populate the user field for each decision
          select: 'name avatar' // Explicitly select name and avatar
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Calculate user stats
    const decisions = user.decisions || [];
    const totalDecisions = decisions.length;
    const positiveOutcomes = decisions.filter(d => d.outcome === 'positive').length;
    const successRate = totalDecisions > 0 ? Math.round((positiveOutcomes / totalDecisions) * 100) : 0;

    // Calculate average confidence
    let avgConfidence = 0;
    if (totalDecisions > 0) {
      const totalConfidence = decisions.reduce((sum, decision) => sum + (decision.confidenceLevel || 50), 0);
      avgConfidence = Math.round(totalConfidence / totalDecisions);
    }

    // Calculate category breakdown
    const categoryStats = {};
    decisions.forEach(decision => {
      categoryStats[decision.category] = (categoryStats[decision.category] || 0) + 1;
    });

    // Calculate confidence vs outcome
    const confidenceOutcomeStats = {
      high: { total: 0, positive: 0 },
      medium: { total: 0, positive: 0 },
      low: { total: 0, positive: 0 }
    };

    decisions.forEach(decision => {
      let confidenceLevel = 'medium';
      if (decision.confidenceLevel >= 70) confidenceLevel = 'high';
      if (decision.confidenceLevel < 40) confidenceLevel = 'low';

      confidenceOutcomeStats[confidenceLevel].total++;
      if (decision.outcome === 'positive') {
        confidenceOutcomeStats[confidenceLevel].positive++;
      }
    });

    // Format response with user data in recentDecisions
    const profileData = {
      user: {
        _id: user._id,
        username: user.name,
        email: user.email,
        bio: user.bio || '',
        location: user.location || '',
        avatar: user.avatar,
        joinedDate: user.createdAt.toLocaleString('default', { month: 'long', year: 'numeric' }),
        followers: user.followers?.length || 0,
        following: user.following?.length || 0,
      },
      stats: {
        totalDecisions,
        successRate,
        avgConfidence,
        categoryStats,
        confidenceOutcomeStats
      },
      recentDecisions: decisions.map(decision => ({
        _id: decision._id,
        title: decision.title,
        category: decision.category,
        confidence: decision.confidenceLevel >= 70 ? 'high' : decision.confidenceLevel >= 40 ? 'medium' : 'low',
        confidenceLevel: decision.confidenceLevel,
        outcome: decision.outcome,
        reflection: decision.reflection,
        createdAt: decision.createdAt,
        options: decision.options,
        likes: decision.likes?.length || 0,
        comments: decision.comments?.length || 0,
        user: decision.user ? {
          _id: decision.user._id,
          name: decision.user.name,
          avatar: decision.user.avatar
        } : null // Safely handle populated user data
      }))
    };

    res.status(200).json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};