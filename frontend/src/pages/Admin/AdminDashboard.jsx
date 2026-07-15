import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAdminAuth } from '../../context/AdminAuthContext';
import StatCard from '../../components/dashboard/StatCard';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAdminAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('adminAccessToken');
        const res = await axios.get('/api/platform-admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [logout]);

  if (loading) return <div className="p-8 text-gray-900">Loading dashboard...</div>;
  if (!stats) return <div className="p-8 text-red-500">Failed to load stats.</div>;

  return (
    <div className="p-8 text-gray-900">
      <h1 className="text-3xl font-bold mb-8">Platform Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          label="Total Businesses" 
          value={stats.totalBusinesses?.total || 0} 
          icon="🏢"
        />
        <StatCard 
          label="Active Businesses" 
          value={stats.totalBusinesses?.active || 0} 
          icon="✅"
        />
        <StatCard 
          label="Bookings Today" 
          value={stats.bookingsToday || 0} 
          icon="📅"
        />
        <StatCard 
          label="Est. MRR" 
          value={`₹${stats.mrr || 0}`} 
          icon="💳"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Trials Expiring Soon (Next 3 Days)</h2>
          {stats.expiringTrials?.length === 0 ? (
            <p className="text-gray-500">No trials expiring in the next 3 days.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {stats.expiringTrials?.map(biz => (
                <li key={biz.id} className="py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{biz.name}</p>
                    <p className="text-xs text-gray-500">{biz.owner_email}</p>
                  </div>
                  <div className="text-sm text-red-600 font-medium">
                    {new Date(biz.trial_ends_at).toLocaleDateString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">New Signups (Last 7 Days)</h2>
          {stats.signupsChart?.length === 0 ? (
            <p className="text-gray-500">No new signups.</p>
          ) : (
            <div className="h-64 flex items-end space-x-2">
              {stats.signupsChart?.map(day => (
                <div key={day.date} className="flex-1 flex flex-col items-center group">
                  <div 
                    className="w-full bg-dashboard-primary/80 rounded-t-sm group-hover:bg-dashboard-primary transition-all"
                    style={{ height: `${Math.max(10, (day.count / 10) * 100)}%` }} // Very rough scaling
                    title={`${day.count} signups on ${day.date}`}
                  ></div>
                  <span className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                    {new Date(day.date).getDate()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
