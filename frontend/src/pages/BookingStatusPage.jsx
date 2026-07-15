import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../api';

const STATUS_CONFIG = {
  pending: { color: '#F59E0B', icon: '⏳', label: 'Pending Confirmation' },
  confirmed: { color: '#10B981', icon: '✅', label: 'Confirmed' },
  cancelled: { color: '#EF4444', icon: '❌', label: 'Cancelled' },
  completed: { color: '#3B82F6', icon: '✔️', label: 'Completed' },
  no_show: { color: '#6B7280', icon: '👻', label: 'No Show' },
};

export default function BookingStatusPage() {
  const { confirmationCode } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [confirmationCode]);

  const loadBooking = async () => {
    try {
      const { data } = await publicAPI.getBookingStatus(confirmationCode);
      setBooking(data.data.booking);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking not found.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950 px-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-2">Booking Not Found</h1>
          <p className="text-surface-400 mb-6">{error}</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-scale-in">
        {/* Business Info */}
        <div className="text-center mb-6">
          {booking.logo_url && (
            <img src={booking.logo_url} alt="" className="w-14 h-14 rounded-xl object-contain bg-white/10 p-1 mx-auto mb-3" />
          )}
          <h1 className="text-xl font-bold text-white">{booking.business_name}</h1>
        </div>

        {/* Status Card */}
        <div className="glass-card p-6 mb-6">
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">{status.icon}</div>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold" style={{ backgroundColor: `${status.color}15`, color: status.color, border: `1px solid ${status.color}30` }}>
              {status.label}
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-surface-400">Guest</span><span className="text-white font-medium">{booking.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">📍 Outlet</span><span className="text-white font-medium">{booking.outlet_name}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">📅 Date</span><span className="text-white font-medium">{booking.booking_date}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">🕐 Time</span><span className="text-white font-medium">{booking.slot_start?.slice(0,5)} – {booking.slot_end?.slice(0,5)}{booking.slot_label ? ` (${booking.slot_label})` : ''}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">👥 Guests</span><span className="text-white font-medium">{booking.guest_count}</span></div>
            {booking.special_requests && (
              <div className="pt-2 border-t border-white/5">
                <p className="text-surface-400 text-sm">Special Requests:</p>
                <p className="text-white text-sm mt-1">{booking.special_requests}</p>
              </div>
            )}
          </div>

          <div className="text-center mt-6 pt-4 border-t border-white/10">
            <p className="text-surface-500 text-xs mb-2">Confirmation Code</p>
            <p className="text-3xl font-bold text-primary-400 tracking-widest">{booking.confirmation_code}</p>
          </div>
        </div>

        {booking.outlet_address && (
          <div className="glass-card p-4 text-center">
            <p className="text-surface-400 text-sm">📍 {booking.outlet_address}</p>
            {booking.outlet_phone && <p className="text-surface-400 text-sm mt-1">📞 {booking.outlet_phone}</p>}
          </div>
        )}

        <p className="text-center text-surface-600 text-xs mt-6">Powered by TableFlow</p>
      </div>
    </div>
  );
}
