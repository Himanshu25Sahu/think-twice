const calculateBasicStats = (decisions) => {
  const totalDecisions = decisions.length;
  const positiveOutcomes = decisions.filter(d => d.outcome === 'positive').length;
  const successRate = totalDecisions > 0 ? Math.round((positiveOutcomes / totalDecisions) * 100) : 0;
  const totalConfidence = decisions.reduce((sum, d) => sum + (d.confidenceLevel || 50), 0);
  const avgConfidence = totalDecisions > 0 ? Math.round(totalConfidence / totalDecisions) : 0;
  const thisWeek = decisions.filter(d => {
    const diffDays = Math.floor((new Date() - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < 7;
  }).length;
  const thisMonth = decisions.filter(d => {
    const diffDays = Math.floor((new Date() - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays < 30;
  }).length;

  return { totalDecisions, successRate, avgConfidence, thisWeek, thisMonth };
};

const calculateCategoryStats = (decisions) => {
  const categoryStats = {};
  decisions.forEach(d => {
    categoryStats[d.category] = (categoryStats[d.category] || 0) + 1;
  });
  return categoryStats;
};

const calculateConfidenceBreakdown = (decisions) => {
  const confidenceBreakdown = { high: 0, medium: 0, low: 0 };
  decisions.forEach(d => {
    const confLevel = d.confidenceLevel >= 70 ? 'high' : d.confidenceLevel >= 40 ? 'medium' : 'low';
    confidenceBreakdown[confLevel]++;
  });
  return confidenceBreakdown;
};

const calculateOutcomesByConfidence = (decisions) => {
  const outcomesByConfidence = {
    high: { positive: 0, neutral: 0, negative: 0 },
    medium: { positive: 0, neutral: 0, negative: 0 },
    low: { positive: 0, neutral: 0, negative: 0 }
  };
  decisions.forEach(d => {
    const confLevel = d.confidenceLevel >= 70 ? 'high' : d.confidenceLevel >= 40 ? 'medium' : 'low';
    if (d.outcome) outcomesByConfidence[confLevel][d.outcome]++;
  });
  return outcomesByConfidence;
};

const calculateTrends = (decisions) => {
  const weeklyTrend = Array(7).fill(0);
  const monthlyTrend = Array(6).fill(0);
  const now = new Date();

  decisions.forEach(d => {
    const diffDays = Math.floor((now - new Date(d.createdAt)) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) weeklyTrend[6 - diffDays]++;
    if (new Date(d.createdAt) >= new Date(now.setMonth(now.getMonth() - 6))) {
      const monthIndex = Math.min(5, Math.floor(diffDays / 30));
      monthlyTrend[5 - monthIndex]++;
    }
  });

  return { weeklyTrend, monthlyTrend };
};

const generateSuggestions = (decisions) => {
  const suggestions = [];
  const categoryConfidence = {};
  const categoryStats = calculateCategoryStats(decisions);
  const totalDecisions = decisions.length;

  decisions.forEach(d => {
    categoryConfidence[d.category] = (categoryConfidence[d.category] || []).concat(d.confidenceLevel || 50);
  });

  Object.entries(categoryConfidence).forEach(([cat, levels]) => {
    const avgCatConfidence = levels.reduce((sum, l) => sum + l, 0) / levels.length;
    const catSuccess = decisions.filter(d => d.category === cat && d.outcome === 'positive').length / (categoryStats[cat] || 1) * 100;
    if (avgCatConfidence < 50) {
      suggestions.push(`Your confidence in ${cat} is low (${Math.round(avgCatConfidence)}%). Consider seeking advice.`);
    } else if (catSuccess < 50) {
      suggestions.push(`Your success rate in ${cat} is ${Math.round(catSuccess)}%. Reflect on past decisions for improvement.`);
    } else if (avgCatConfidence >= 70) {
      suggestions.push(`You’re doing great in ${cat} with ${Math.round(avgCatConfidence)}% confidence! Keep it up.`);
    }
  });

  const { avgConfidence } = calculateBasicStats(decisions);
  if (avgConfidence < 50) {
    suggestions.push("Your overall confidence is low. Consider consulting others for support.");
  }

  return suggestions;
};

export default {
  calculateBasicStats,
  calculateCategoryStats,
  calculateConfidenceBreakdown,
  calculateOutcomesByConfidence,
  calculateTrends,
  generateSuggestions
};