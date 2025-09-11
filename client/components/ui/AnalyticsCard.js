// components/ui/AnalyticsCard.jsx
import React from "react";

const AnalyticsCard = ({ title, value, subtitle, trend, color }) => {
  const getTrendColor = (trendValue) => {
    return trendValue >= 0 ? "text-green-400" : "text-red-400";
  };

  return (
    <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800">
      <h3 className="text-sm font-medium text-gray-400 mb-2">{title}</h3>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{subtitle}</p>
        <div className={`text-xs font-medium ${getTrendColor(trend)}`}>
          {trend >= 0 ? `+${trend}%` : `${trend}%`}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCard;