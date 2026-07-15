import { useState, useEffect } from 'react';
import { customerAPI } from '../../api';
import toast from 'react-hot-toast';
import DataTable from '../../components/dashboard/DataTable';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data } = await customerAPI.list();
      setCustomers(data.data.customers);
    } catch (err) {
      toast.error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    
    const headers = ['Name', 'Phone', 'Email', 'Total Bookings', 'No-Shows', 'Last Booking Date'];
    const rows = customers.map(c => [
      c.name, c.phone, c.email || '', c.total_bookings, c.no_show_count, 
      c.last_booking_date ? new Date(c.last_booking_date).toLocaleDateString() : ''
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const columns = [
    {
      header: 'Name',
      accessor: 'name',
      render: (c) => <p className="font-medium text-gray-900">{c.name}</p>
    },
    {
      header: 'Contact',
      accessor: 'phone',
      render: (c) => (
        <div>
          <p className="text-sm text-gray-900">{c.phone}</p>
          {c.email && <p className="text-xs text-gray-500">{c.email}</p>}
        </div>
      )
    },
    {
      header: 'Bookings',
      accessor: 'total_bookings',
      render: (c) => (
        <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-sm font-semibold border border-gray-200">
          {c.total_bookings}
        </span>
      )
    },
    {
      header: 'No-shows',
      accessor: 'no_show_count',
      render: (c) => (
        c.no_show_count > 0 ? (
          <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-sm font-semibold">
            {c.no_show_count}
          </span>
        ) : (
          <span className="text-gray-400 text-sm font-medium">0</span>
        )
      )
    },
    {
      header: 'Last Booking',
      accessor: 'last_booking_date',
      render: (c) => (
        <span className="text-gray-600 text-sm">
          {c.last_booking_date ? new Date(c.last_booking_date).toLocaleDateString() : '—'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: () => (
        <div className="flex justify-end">
          <button className="btn-dashboard-secondary text-xs !px-3 !py-1.5" onClick={() => toast('Booking history modal coming soon!', { icon: '🚧' })}>
            View History
          </button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 mt-1">People who have booked with you</p>
        </div>
        <button onClick={handleExportCSV} className="btn-dashboard-secondary flex items-center gap-2">
          <span>📥</span> Export CSV
        </button>
      </div>

      <div className="dashboard-card p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Search by name, phone or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="dashboard-input flex-1"
        />
      </div>

      {/* Table */}
      <DataTable 
        columns={columns}
        data={filteredCustomers}
        loading={loading}
        emptyMessage="Customers will appear here when they make a booking, or if none match your search."
      />
    </div>
  );
}
