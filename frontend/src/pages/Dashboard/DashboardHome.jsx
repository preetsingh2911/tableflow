import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { bookingAPI } from '../../api';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/dashboard/StatusBadge';

export default function DashboardHome() {
  const { business } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data } = await bookingAPI.getStats();
      setStats(data.data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            {getGreeting()}, {business?.owner_name || 'Owner'} 👋
          </h1>
          <p className="text-gray-500 mt-1">Here's what's happening with your bookings today.</p>
        </div>
        <button onClick={() => navigate('/dashboard/bookings?manual=true')} className="btn-dashboard-primary flex items-center gap-2">
          <span>+</span> New Manual Booking
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="spinner border-dashboard-primary border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Today's Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard 
              label="Bookings Today" 
              value={stats?.todayBookings || 0}
              icon="📅"
            />
            <StatCard 
              label="Confirmed" 
              value={stats?.todayConfirmed || 0}
              icon="✅"
            />
            <StatCard 
              label="Pending" 
              value={stats?.todayPending || 0}
              icon="⏳"
            />
            <StatCard 
              label="No-shows" 
              value={stats?.todayNoShows || 0}
              icon="⚠️"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upcoming Bookings */}
            <div className="lg:col-span-2 dashboard-card p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings (Next 5)</h2>
                <button onClick={() => navigate('/dashboard/bookings')} className="text-dashboard-primary text-sm font-medium hover:underline">
                  View all
                </button>
              </div>
              
              {!stats?.upcomingList || stats.upcomingList.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p>No upcoming bookings found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.upcomingList.map(booking => (
                    <div key={booking.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-900">{booking.customer_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(booking.date).toLocaleDateString()} • {booking.slot_label || 'Time TBD'} • {booking.guests} Guests
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600 hidden sm:inline">{booking.outlet_name}</span>
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions / Info */}
            <div className="dashboard-card p-6 flex flex-col gap-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Quick Actions</h2>
              <button onClick={() => navigate('/dashboard/slots')} className="btn-dashboard-secondary w-full text-left flex items-center gap-3">
                <span className="text-xl">⏱️</span> Manage Time Slots
              </button>
              <button onClick={() => navigate('/dashboard/blocked-dates')} className="btn-dashboard-secondary w-full text-left flex items-center gap-3">
                <span className="text-xl">⛔</span> Block Dates
              </button>
              <button onClick={() => navigate('/dashboard/booking-page')} className="btn-dashboard-secondary w-full text-left flex items-center gap-3">
                <span className="text-xl">🎨</span> Edit Booking Page
              </button>
              
              <div className="mt-auto pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Your Booking Link</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={`https://${business?.slug}.tableflow.in`}
                    className="dashboard-input text-sm py-2"
                  />
                  <button 
                    onClick={() => navigator.clipboard.writeText(`https://${business?.slug}.tableflow.in`)}
                    className="btn-dashboard-secondary !px-3 !py-2"
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
