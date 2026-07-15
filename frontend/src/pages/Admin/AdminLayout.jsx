import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { 
  HomeIcon, 
  BuildingStorefrontIcon, 
  CurrencyRupeeIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/platform-admin/dashboard', icon: HomeIcon },
  { name: 'Businesses', href: '/platform-admin/businesses', icon: BuildingStorefrontIcon },
  { name: 'Subscriptions', href: '/platform-admin/subscriptions', icon: CurrencyRupeeIcon },
  { name: 'Settings', href: '/platform-admin/settings', icon: Cog6ToothIcon },
];

export default function AdminLayout() {
  const { adminUser, isLoading, logout } = useAdminAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="spinner border-dashboard-primary border-t-transparent" />
    </div>
  );
  if (!adminUser) return <Navigate to="/platform-admin/login" replace />;

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navigation.map((item) => {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              isActive 
                ? 'bg-dashboard-primary/10 text-dashboard-primary border-l-4 border-dashboard-primary' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
            }`}
          >
            <item.icon className="flex-shrink-0 h-6 w-6" aria-hidden="true" />
            <span>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  const UserSection = () => (
    <div className="px-4 py-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-sm">
          A
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{adminUser.name}</p>
          <p className="text-xs text-gray-500 truncate">{adminUser.email}</p>
        </div>
      </div>
      <button
        onClick={logout}
        className="flex items-center w-full text-left text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
      >
        <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-2xl text-dashboard-primary">⚡</span>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Admin</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
        >
          {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-10 bg-gray-900/50" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-20
        w-64 bg-white border-r border-gray-200 flex flex-col h-full
        transform transition-transform duration-200 ease-in-out
        ${mobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Desktop Logo */}
        <div className="hidden md:flex px-6 py-5 border-b border-gray-200 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gray-900 tracking-tight">TABLEFLOW <span className="text-dashboard-primary">ADMIN</span></span>
          </div>
        </div>

        <NavLinks />
        <UserSection />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col w-full md:max-w-[calc(100vw-16rem)] min-h-[calc(100vh-65px)] md:min-h-screen">
        <div className="page-enter flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
