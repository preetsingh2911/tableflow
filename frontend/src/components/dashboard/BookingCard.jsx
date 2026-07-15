import React from 'react';
import StatusBadge from './StatusBadge';

export default function BookingCard({ booking, onUpdateStatus, isLoading }) {
  const isPending = booking.status === 'pending';
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="dashboard-card p-5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-bold text-gray-900">{booking.customer_name}</h4>
          <p className="text-sm text-gray-500">{booking.customer_phone}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-6">
        <div>
          <p className="text-gray-500">Date & Time</p>
          <p className="font-medium text-gray-900">
            {new Date(booking.booking_date).toLocaleDateString()} at {booking.start_time.slice(0,5)}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Guests</p>
          <p className="font-medium text-gray-900">{booking.guest_count} People</p>
        </div>
        <div className="col-span-2">
          <p className="text-gray-500">Reference</p>
          <p className="font-mono text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded inline-block">
            {booking.confirmation_code}
          </p>
        </div>
        {booking.special_requests && (
          <div className="col-span-2 mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
            <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">Special Requests</p>
            <p className="text-sm text-yellow-900">{booking.special_requests}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-auto pt-4 border-t border-gray-100">
        {isPending && (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'confirmed')}
            disabled={isLoading}
            className="flex-1 btn-dashboard-primary"
          >
            Confirm
          </button>
        )}
        {(isPending || isConfirmed) && (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'cancelled')}
            disabled={isLoading}
            className="flex-1 btn-dashboard-danger"
          >
            Cancel
          </button>
        )}
        {isConfirmed && (
          <button 
            onClick={() => onUpdateStatus(booking.id, 'seated')}
            disabled={isLoading}
            className="flex-1 btn-dashboard-secondary"
          >
            Mark Seated
          </button>
        )}
      </div>
    </div>
  );
}
