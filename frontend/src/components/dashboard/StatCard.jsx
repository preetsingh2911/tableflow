import React from 'react';

export default function StatCard({ label, value, icon, trend, trendValue }) {
  return (
    <div className="dashboard-card p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{label}</h3>
        {icon && <span className="text-xl text-gray-400">{icon}</span>}
      </div>
      <div className="mt-auto">
        <div className="flex items-baseline gap-4">
          <span className="text-3xl font-bold text-gray-900">{value}</span>
          {trend && trendValue && (
            <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'}
              <span className="ml-1">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
