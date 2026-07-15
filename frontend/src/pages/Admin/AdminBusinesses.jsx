import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import DataTable from '../../components/dashboard/DataTable';
import StatusBadge from '../../components/dashboard/StatusBadge';

export default function AdminBusinesses() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  useEffect(() => {
    fetchBusinesses();
  }, [statusFilter]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminAccessToken');
      const res = await axios.get('/api/platform-admin/businesses', {
        headers: { Authorization: `Bearer ${token}` },
        params: { search, status: statusFilter }
      });
      setBusinesses(res.data.data.businesses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBusinesses();
  };

  const handleImpersonate = async (businessId) => {
    try {
      const token = localStorage.getItem('adminAccessToken');
      const res = await axios.post(`/api/platform-admin/businesses/${businessId}/impersonate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { impersonationToken } = res.data.data;
      // Stash admin tokens temporarily to allow return
      localStorage.setItem('adminReturnAccessToken', token);
      localStorage.setItem('adminReturnRefreshToken', localStorage.getItem('adminRefreshToken'));
      
      // Overwrite business owner tokens for impersonation
      localStorage.setItem('accessToken', impersonationToken);
      // Let's redirect to business dashboard
      window.location.href = '/dashboard';
    } catch (err) {
      alert('Failed to impersonate');
    }
  };

  return (
    <div className="p-8 text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Businesses</h1>
      </div>

      <div className="dashboard-card p-4 mb-6 flex space-x-4">
        <form onSubmit={handleSearch} className="flex-1 flex space-x-2">
          <input 
            type="text" 
            placeholder="Search by name, slug, or owner email..." 
            className="dashboard-input flex-1"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit" className="btn-dashboard-primary px-4">
            Search
          </button>
        </form>
        <select 
          className="dashboard-input w-48"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="trial">Trial</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable 
        loading={loading}
        data={businesses}
        emptyMessage="No businesses found."
        columns={[
          {
            header: 'Business',
            accessor: 'name',
            render: (biz) => (
              <div>
                <div className="text-sm font-bold text-gray-900">{biz.name}</div>
                <div className="text-sm text-gray-500">{biz.owner_email}</div>
              </div>
            )
          },
          {
            header: 'Plan / Status',
            accessor: 'status',
            render: (biz) => (
              <div>
                <StatusBadge status={biz.subscription_status} />
                <div className="text-sm text-gray-500 mt-1 capitalize">{biz.subscription_plan}</div>
              </div>
            )
          },
          {
            header: 'Stats',
            accessor: 'stats',
            render: (biz) => (
              <div>
                <div className="text-sm font-medium text-gray-900">{biz.outlets_count} Outlets</div>
                <div className="text-sm text-gray-500">{biz.total_bookings} Bookings</div>
              </div>
            )
          },
          {
            header: 'Created',
            accessor: 'created_at',
            render: (biz) => new Date(biz.created_at).toLocaleDateString()
          },
          {
            header: 'Actions',
            accessor: 'actions',
            render: (biz) => (
              <button 
                onClick={() => handleImpersonate(biz.id)}
                className="text-dashboard-primary hover:text-dashboard-primary/80 font-semibold"
              >
                Impersonate
              </button>
            )
          }
        ]}
      />
    </div>
  );
}
