import { useState, useEffect } from 'react';
import { outletAPI } from '../../api';
import toast from 'react-hot-toast';
import Modal from '../../components/dashboard/Modal';

export default function OutletsPage() {
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '', address: '', city: '', phone: '',
    manager_name: '', manager_phone: '', manager_email: '',
    total_tables: 10, max_guests_per_booking: 20, is_active: true
  });

  // Delete Confirmation Modal State
  const [outletToDelete, setOutletToDelete] = useState(null);

  useEffect(() => { loadOutlets(); }, []);

  const loadOutlets = async () => {
    try {
      const { data } = await outletAPI.list();
      setOutlets(data.data.outlets);
    } catch (err) {
      toast.error('Failed to load outlets.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ 
      name: '', address: '', city: '', phone: '',
      manager_name: '', manager_phone: '', manager_email: '',
      total_tables: 10, max_guests_per_booking: 20, is_active: true
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (outlet) => {
    setForm({
      name: outlet.name, address: outlet.address, city: outlet.city, phone: outlet.phone || '',
      manager_name: outlet.manager_name || '', manager_phone: outlet.manager_phone || '', 
      manager_email: outlet.manager_email || '', total_tables: outlet.total_tables, 
      max_guests_per_booking: outlet.max_guests_per_booking, is_active: outlet.is_active
    });
    setEditingId(outlet.id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await outletAPI.update(editingId, form);
        toast.success('Outlet updated!');
      } else {
        await outletAPI.create(form);
        toast.success('Outlet created!');
      }
      resetForm();
      loadOutlets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save outlet.');
    }
  };

  const confirmDelete = async () => {
    if (!outletToDelete) return;
    try {
      await outletAPI.delete(outletToDelete.id);
      toast.success('Outlet deleted.');
      setOutletToDelete(null);
      loadOutlets();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete outlet.');
    }
  };
  
  const handleToggleActive = async (id, currentStatus) => {
    try {
      await outletAPI.update(id, { is_active: !currentStatus });
      toast.success(`Outlet ${!currentStatus ? 'activated' : 'deactivated'}.`);
      loadOutlets();
    } catch (err) {
      toast.error('Failed to update outlet status.');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
          <p className="text-gray-500 mt-1">Manage your restaurant locations</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-dashboard-primary flex items-center gap-2">
          <span>+</span> Add Outlet
        </button>
      </div>

      {/* Form Modal */}
      <Modal isOpen={showForm} onClose={resetForm} title={editingId ? 'Edit Outlet' : 'New Outlet'}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Name *</label>
              <input value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className="dashboard-input" required placeholder="e.g. Bandra West" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} className="dashboard-input" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
              <input value={form.address} onChange={e => setForm(p => ({...p, address: e.target.value}))} className="dashboard-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Outlet Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="dashboard-input" />
            </div>
          </div>
          
          <hr className="border-gray-200 my-2" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Manager Details</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
              <input value={form.manager_name} onChange={e => setForm(p => ({...p, manager_name: e.target.value}))} className="dashboard-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
                <input value={form.manager_phone} onChange={e => setForm(p => ({...p, manager_phone: e.target.value}))} className="dashboard-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Manager Email</label>
                <input type="email" value={form.manager_email} onChange={e => setForm(p => ({...p, manager_email: e.target.value}))} className="dashboard-input" />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 my-2" />
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Capacity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Tables</label>
              <input type="number" min="1" value={form.total_tables} onChange={e => setForm(p => ({...p, total_tables: parseInt(e.target.value)}))} className="dashboard-input" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Guests per Booking</label>
              <input type="number" min="1" value={form.max_guests_per_booking} onChange={e => setForm(p => ({...p, max_guests_per_booking: parseInt(e.target.value)}))} className="dashboard-input" required />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button type="button" onClick={resetForm} className="btn-dashboard-secondary">Cancel</button>
            <button type="submit" className="btn-dashboard-primary">{editingId ? 'Save Changes' : 'Create Outlet'}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!outletToDelete} onClose={() => setOutletToDelete(null)} title="Delete Outlet">
        <div className="mb-6">
          <p className="text-gray-600">Are you sure you want to delete <strong className="text-gray-900">{outletToDelete?.name}</strong>?</p>
          <p className="text-red-600 text-sm mt-2 font-medium">This action cannot be undone. It will fail if there are any upcoming bookings associated with this outlet.</p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button onClick={() => setOutletToDelete(null)} className="btn-dashboard-secondary">Cancel</button>
          <button onClick={confirmDelete} className="btn-dashboard-danger">Delete Outlet</button>
        </div>
      </Modal>

      {/* Outlet List */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="spinner border-dashboard-primary border-t-transparent" /></div>
      ) : outlets.length === 0 ? (
        <div className="dashboard-card p-12 text-center bg-gray-50">
          <div className="text-5xl mb-4 text-gray-400">🏢</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No outlets yet</h3>
          <p className="text-gray-500 mb-6">Add your first restaurant location to start accepting bookings.</p>
          <button onClick={() => setShowForm(true)} className="btn-dashboard-primary">Add First Outlet</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {outlets.map(outlet => (
            <div key={outlet.id} className="dashboard-card p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {outlet.name}
                    {!outlet.is_active && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-medium">Inactive</span>}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">{outlet.city}</p>
                </div>
                <button 
                  onClick={() => handleToggleActive(outlet.id, outlet.is_active)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors border ${outlet.is_active ? 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-900' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
                >
                  {outlet.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
              
              <div className="space-y-3 mb-6 flex-grow border-t border-gray-100 pt-4 mt-2">
                <p className="text-sm text-gray-700 flex">
                  <span className="text-gray-500 w-24 flex-shrink-0 font-medium">Address</span>
                  <span className="truncate">{outlet.address}</span>
                </p>
                <p className="text-sm text-gray-700 flex">
                  <span className="text-gray-500 w-24 flex-shrink-0 font-medium">Phone</span>
                  <span>{outlet.phone || '—'}</span>
                </p>
                <p className="text-sm text-gray-700 flex">
                  <span className="text-gray-500 w-24 flex-shrink-0 font-medium">Manager</span>
                  <span>{outlet.manager_name || '—'} {outlet.manager_phone ? `(${outlet.manager_phone})` : ''}</span>
                </p>
                <p className="text-sm text-gray-700 flex">
                  <span className="text-gray-500 w-24 flex-shrink-0 font-medium">Capacity</span>
                  <span>{outlet.total_tables} tables (Max {outlet.max_guests_per_booking} pax/booking)</span>
                </p>
              </div>
              
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => handleEdit(outlet)} className="btn-dashboard-secondary flex-1">Edit Details</button>
                <button onClick={() => setOutletToDelete(outlet)} className="btn-dashboard-secondary text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200 hover:border-red-200">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
