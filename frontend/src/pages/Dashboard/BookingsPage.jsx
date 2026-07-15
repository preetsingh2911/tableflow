import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { bookingAPI, outletAPI, slotAPI } from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/dashboard/DataTable';
import StatusBadge from '../../components/dashboard/StatusBadge';
import Modal from '../../components/dashboard/Modal';

export default function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  
  const [activeTab, setActiveTab] = useState('upcoming'); // today | upcoming | past | all | waitlist
  const [filters, setFilters] = useState({ outletId: '', status: '', date: '', search: '', page: 1, occasion: '' });
  
  // Modals
  const [showManualModal, setShowManualModal] = useState(searchParams.get('manual') === 'true');
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [viewBooking, setViewBooking] = useState(null);

  // Manual Booking Form State
  const [manualForm, setManualForm] = useState({
    outletId: '', date: new Date().toISOString().split('T')[0], timeSlotId: '',
    customerName: '', customerPhone: '', customerEmail: '', guests: 2, occasion: 'none', specialRequests: '', sendConfirmation: false
  });
  const [slots, setSlots] = useState([]);

  useEffect(() => {
    outletAPI.list().then(res => {
      setOutlets(res.data.data.outlets);
      if (res.data.data.outlets.length > 0) {
        setManualForm(f => ({ ...f, outletId: res.data.data.outlets[0].id }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (manualForm.outletId && manualForm.date) {
      slotAPI.list(manualForm.outletId).then(res => setSlots(res.data.data.slots)).catch(() => {});
    }
  }, [manualForm.outletId, manualForm.date]);

  useEffect(() => { loadBookings(); }, [filters, activeTab]);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const params = { ...filters, limit: 15 };
      
      const today = new Date().toISOString().split('T')[0];
      if (activeTab === 'today') params.date = today;
      else if (activeTab === 'upcoming') params.dateFrom = today;
      else if (activeTab === 'past') params.dateTo = today;
      // if 'all', no date filter
      
      const { data } = await bookingAPI.list(params);
      setBookings(data.data.data);
      setPagination(data.data.pagination);
    } catch (err) {
      toast.error('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, status, reason = '') => {
    try {
      await bookingAPI.updateStatus(id, { status, cancellationReason: reason });
      toast.success(`Booking ${status}.`);
      setCancelModalBooking(null);
      setCancelReason('');
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    try {
      await bookingAPI.createManual(manualForm);
      toast.success('Manual booking created!');
      setShowManualModal(false);
      
      if (searchParams.get('manual')) {
        setSearchParams({});
      }
      
      loadBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create booking.');
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'customer_name',
      render: (b) => (
        <div className="cursor-pointer hover:text-dashboard-primary transition-colors" onClick={() => setViewBooking(b)}>
          <p className="font-medium">{b.customer_name}</p>
          <p className="text-xs text-gray-500">{b.customer_phone}</p>
        </div>
      )
    },
    {
      header: 'Details',
      accessor: 'guests',
      render: (b) => (
        <div>
          <p className="text-sm">{b.guests} Guests {b.occasion !== 'none' && `• ${b.occasion}`}</p>
          {b.special_requests && (
            <p className="text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded mt-1 inline-block border border-yellow-100">
              Note: {b.special_requests.length > 20 ? b.special_requests.substring(0,20)+'...' : b.special_requests}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Time',
      accessor: 'date',
      render: (b) => (
        <div>
          <p className="text-sm">{new Date(b.date).toLocaleDateString()}</p>
          <p className="text-xs text-gray-500">
            {b.slot_start?.slice(0,5)} {b.slot_label && `(${b.slot_label})`}
          </p>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (b) => <StatusBadge status={b.status} />
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (b) => (
        <div className="flex justify-end gap-2">
          {b.status === 'pending' && (
            <button onClick={() => handleStatusChange(b.id, 'confirmed')} className="btn-dashboard-primary !py-1 !px-3 text-xs">Confirm</button>
          )}
          {b.status === 'confirmed' && (
            <button onClick={() => handleStatusChange(b.id, 'seated')} className="bg-blue-600 hover:bg-blue-700 text-white font-medium !py-1 !px-3 text-xs rounded transition-colors">Seat</button>
          )}
          {['pending', 'confirmed'].includes(b.status) && (
            <button onClick={() => setCancelModalBooking(b)} className="text-red-600 hover:text-red-800 border border-red-200 hover:bg-red-50 bg-white font-medium !py-1 !px-3 text-xs rounded transition-colors">Cancel</button>
          )}
          {b.status === 'seated' && (
            <button onClick={() => handleStatusChange(b.id, 'completed')} className="btn-dashboard-secondary !py-1 !px-3 text-xs">Complete</button>
          )}
          {['confirmed', 'seated'].includes(b.status) && (
            <button onClick={() => handleStatusChange(b.id, 'no_show')} className="text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 font-medium !py-1 !px-3 text-xs rounded transition-colors">No Show</button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">Manage all your reservations</p>
        </div>
        <button onClick={() => setShowManualModal(true)} className="btn-dashboard-primary flex items-center gap-2">
          <span>+</span> Manual Booking
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200 mb-6 overflow-x-auto">
        {['today', 'upcoming', 'past', 'all', 'waitlist'].map(tab => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setFilters(f => ({...f, page: 1})); }}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-dashboard-primary text-dashboard-primary' 
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="dashboard-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search name, phone, code..."
          value={filters.search}
          onChange={e => setFilters(p => ({...p, search: e.target.value, page: 1}))}
          className="dashboard-input !w-auto flex-1 min-w-[200px]"
        />
        {outlets.length > 1 && (
          <select
            value={filters.outletId}
            onChange={e => setFilters(p => ({...p, outletId: e.target.value, page: 1}))}
            className="dashboard-input !w-auto"
          >
            <option value="">All Outlets</option>
            {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
        <select
          value={filters.status}
          onChange={e => setFilters(p => ({...p, status: e.target.value, page: 1}))}
          className="dashboard-input !w-auto"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="seated">Seated</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No Show</option>
        </select>
        <select
          value={filters.occasion}
          onChange={e => setFilters(p => ({...p, occasion: e.target.value, page: 1}))}
          className="dashboard-input !w-auto"
        >
          <option value="">Any Occasion</option>
          <option value="birthday">Birthday</option>
          <option value="anniversary">Anniversary</option>
          <option value="date">Date</option>
          <option value="business">Business</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Table */}
      <DataTable 
        columns={columns} 
        data={activeTab === 'waitlist' ? [] : bookings} 
        loading={loading}
        emptyMessage={activeTab === 'waitlist' ? "Waitlist feature is pending integration." : "Try adjusting your filters or date range."}
      />

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-4 mt-4 dashboard-card">
          <p className="text-sm text-gray-500">
            Page <span className="font-medium text-gray-900">{pagination.page}</span> of <span className="font-medium text-gray-900">{pagination.totalPages}</span> ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button 
              disabled={pagination.page <= 1} 
              onClick={() => setFilters(p => ({...p, page: p.page - 1}))} 
              className="btn-dashboard-secondary !py-1.5 !px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button 
              disabled={!pagination.hasMore} 
              onClick={() => setFilters(p => ({...p, page: p.page + 1}))} 
              className="btn-dashboard-secondary !py-1.5 !px-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Manual Booking Modal */}
      <Modal isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="New Manual Booking">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet</label>
              <select required className="dashboard-input" value={manualForm.outletId} onChange={e => setManualForm({...manualForm, outletId: e.target.value})}>
                <option value="">Select Outlet...</option>
                {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" required className="dashboard-input" value={manualForm.date} onChange={e => setManualForm({...manualForm, date: e.target.value})} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
              <select required className="dashboard-input" value={manualForm.timeSlotId} onChange={e => setManualForm({...manualForm, timeSlotId: e.target.value})}>
                <option value="">Select Time...</option>
                {slots.map(s => <option key={s.id} value={s.id}>{s.start_time.slice(0,5)} {s.label && `(${s.label})`}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
              <input type="number" min="1" max="50" required className="dashboard-input" value={manualForm.guests} onChange={e => setManualForm({...manualForm, guests: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
            <input type="text" required className="dashboard-input" value={manualForm.customerName} onChange={e => setManualForm({...manualForm, customerName: e.target.value})} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" required className="dashboard-input" value={manualForm.customerPhone} onChange={e => setManualForm({...manualForm, customerPhone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
              <input type="email" className="dashboard-input" value={manualForm.customerEmail} onChange={e => setManualForm({...manualForm, customerEmail: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occasion</label>
            <select className="dashboard-input" value={manualForm.occasion} onChange={e => setManualForm({...manualForm, occasion: e.target.value})}>
              <option value="none">None</option>
              <option value="birthday">Birthday</option>
              <option value="anniversary">Anniversary</option>
              <option value="date">Date</option>
              <option value="business">Business</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows="2" className="dashboard-input resize-none" value={manualForm.specialRequests} onChange={e => setManualForm({...manualForm, specialRequests: e.target.value})}></textarea>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" id="sendConfirmation" checked={manualForm.sendConfirmation} onChange={e => setManualForm({...manualForm, sendConfirmation: e.target.checked})} className="rounded bg-white border-gray-300 text-dashboard-primary focus:ring-dashboard-primary h-4 w-4" />
            <label htmlFor="sendConfirmation" className="text-sm text-gray-700">Send confirmation to customer</label>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowManualModal(false)} className="btn-dashboard-secondary">Cancel</button>
            <button type="submit" className="btn-dashboard-primary">Create Booking</button>
          </div>
        </form>
      </Modal>

      {/* Cancel Modal */}
      <Modal isOpen={!!cancelModalBooking} onClose={() => {setCancelModalBooking(null); setCancelReason('');}} title="Cancel Booking">
        {cancelModalBooking && (
          <div>
            <p className="text-gray-600 mb-4">Are you sure you want to cancel the booking for <span className="font-semibold text-gray-900">{cancelModalBooking.customer_name}</span>?</p>
            
            <label className="block text-sm font-medium text-gray-700 mb-1">Cancellation Reason</label>
            <textarea required rows="3" className="dashboard-input resize-none mb-6" placeholder="Customer requested, fully booked, etc." value={cancelReason} onChange={e => setCancelReason(e.target.value)}></textarea>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button onClick={() => {setCancelModalBooking(null); setCancelReason('');}} className="btn-dashboard-secondary">Keep Booking</button>
              <button onClick={() => handleStatusChange(cancelModalBooking.id, 'cancelled', cancelReason)} disabled={!cancelReason} className="btn-dashboard-danger">Confirm Cancellation</button>
            </div>
          </div>
        )}
      </Modal>
      
      {/* View Booking Modal */}
      <Modal isOpen={!!viewBooking} onClose={() => setViewBooking(null)} title="Booking Details">
        {viewBooking && (
          <div className="space-y-5">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500 font-medium">Reference Code</p>
                <code className="text-gray-900 font-mono font-bold text-lg">{viewBooking.booking_ref || viewBooking.confirmation_code}</code>
              </div>
              <StatusBadge status={viewBooking.status} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Customer</p>
                <p className="text-gray-900 font-semibold">{viewBooking.customer_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone</p>
                <p className="text-gray-900">{viewBooking.customer_phone}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Date</p>
                <p className="text-gray-900">{new Date(viewBooking.date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Time</p>
                <p className="text-gray-900">{viewBooking.slot_start?.slice(0,5)} {viewBooking.slot_label && `(${viewBooking.slot_label})`}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Guests</p>
                <p className="text-gray-900">{viewBooking.guests} People</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Occasion</p>
                <p className="text-gray-900 capitalize">{viewBooking.occasion || 'None'}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 font-medium">Special Requests</p>
              <p className="text-gray-900">{viewBooking.special_requests || 'None'}</p>
            </div>
            
            {viewBooking.cancellation_reason && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-red-800 text-sm">
                <span className="font-bold block mb-1">Cancellation Reason:</span>
                {viewBooking.cancellation_reason}
              </div>
            )}

            <div className="mt-8 flex justify-end pt-4 border-t border-gray-200">
              <button onClick={() => setViewBooking(null)} className="btn-dashboard-secondary">Close</button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
