import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../api';
import toast from 'react-hot-toast';

export default function CancelBookingPage() {
  const { confirmationCode } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const [cancelled, setCancelled] = useState(false);

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

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;
    setCancelling(true);
    try {
      await publicAPI.cancelBooking(confirmationCode);
      setCancelled(true);
      toast.success('Booking cancelled successfully.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="spinner border-t-white" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface-950 px-4">
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-white mb-2">Oops!</h1>
        <p className="text-surface-400 text-center mb-6">{error || 'Booking not found.'}</p>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300">Return Home</Link>
      </div>
    );
  }

  const isAlreadyCancelled = booking.status === 'cancelled';
  const brandColor = '#E11D48'; // Red for cancellation

  return (
    <div className="min-h-screen bg-surface-950 font-sans flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md glass-card border-surface-800 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: brandColor }} />
        
        <div className="p-8">
          <div className="text-center mb-8">
            {booking.logo_url && (
              <img src={booking.logo_url} alt={booking.business_name} className="w-16 h-16 rounded-xl mx-auto mb-4 object-contain bg-white/5 p-1 ring-1 ring-white/10" />
            )}
            <h1 className="text-2xl font-bold text-white">Manage Booking</h1>
            <p className="text-surface-400 mt-1">{booking.business_name}</p>
          </div>

          <div className="bg-surface-900 rounded-xl p-5 mb-8 border border-surface-800 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-surface-400">Ref Code</span><span className="text-white font-mono font-medium">{booking.confirmation_code}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Guest</span><span className="text-white font-medium">{booking.customer_name}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Date</span><span className="text-white font-medium">{booking.booking_date}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Time</span><span className="text-white font-medium">{booking.slot_start?.slice(0,5)}</span></div>
            <div className="flex justify-between"><span className="text-surface-400">Status</span>
              <span className={`font-medium capitalize ${
                booking.status === 'confirmed' ? 'text-emerald-400' :
                booking.status === 'pending' ? 'text-amber-400' : 'text-red-400'
              }`}>
                {booking.status}
              </span>
            </div>
          </div>

          {cancelled || isAlreadyCancelled ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Booking Cancelled</h2>
              <p className="text-surface-400 text-sm">Your reservation has been successfully cancelled.</p>
            </div>
          ) : (
            <>
              <p className="text-surface-400 text-sm text-center mb-6">
                Need to cancel? Please note that cancellations must be made at least 2 hours prior to your booking time.
              </p>
              <button 
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-3 rounded-xl font-bold text-white transition-all hover:bg-red-600 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                style={{ backgroundColor: brandColor }}
              >
                {cancelling ? <div className="spinner border-t-white" /> : 'Cancel Booking'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
