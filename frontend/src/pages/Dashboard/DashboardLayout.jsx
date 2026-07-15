import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const sidebarLinks = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard', end: true },
  { to: '/dashboard/bookings', icon: '📋', label: 'Bookings' },
  { to: '/dashboard/outlets', icon: '🏢', label: 'Outlets' },
  { to: '/dashboard/slots', icon: '⏱️', label: 'Time Slots' },
  { to: '/dashboard/blocked-dates', icon: '⛔', label: 'Blocked Dates' },
  { to: '/dashboard/customers', icon: '👥', label: 'Customers' },
  { to: '/dashboard/analytics', icon: '📈', label: 'Analytics' },
  { to: '/dashboard/booking-page', icon: '🎨', label: 'Booking Page' },
  { to: '/dashboard/billing', icon: '💳', label: 'Subscription & Billing' },
  { to: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (business && !business.description && location.pathname !== '/dashboard/onboarding') {
      navigate('/dashboard/onboarding');
    }
  }, [business, navigate, location]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const bookingUrl = business?.slug ? `/book/${business.slug}` : '#';

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {sidebarLinks.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setMobileMenuOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-colors ${
              isActive 
                ? 'bg-dashboard-primary/10 text-dashboard-primary border-l-4 border-dashboard-primary' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
            }`
          }
        >
          <span className="text-xl">{link.icon}</span>
          <span>{link.label}</span>
        </NavLink>
      ))}
      
      {/* Booking page external link */}
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-dashboard-primary hover:text-dashboard-primaryDark transition-colors border-l-4 border-transparent mt-4"
      >
        <span className="text-xl">🔗</span>
        <span>View Booking Page</span>
      </a>
    </nav>
  );

  const UserSection = () => (
    <div className="px-4 py-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-dashboard-primary/20 flex items-center justify-center text-dashboard-primary font-bold text-sm">
          {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="w-full text-left text-sm font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1"
      >
        Sign out →
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold text-gray-900 tracking-tight">TableFlow</span>
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
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight">TableFlow</span>
          </div>
          {business && (
            <p className="text-xs font-medium text-gray-500 mt-1 truncate">{business.name}</p>
          )}
        </div>

        <NavLinks />
        <UserSection />
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 flex flex-col w-full md:max-w-[calc(100vw-16rem)] min-h-[calc(100vh-65px)] md:min-h-screen">
        
        {business && business.subscription_status === 'trial' && (
          <div className="bg-dashboard-warningBg border-l-4 border-dashboard-warningText p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <span className="text-dashboard-warningText mr-3">⚠️</span>
              <p className="text-sm font-medium text-yellow-800">
                Your trial ends in {Math.ceil((new Date(business.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24))} days. {' '}
                <NavLink to="/dashboard/billing" className="font-bold underline text-yellow-900 hover:text-yellow-700">
                  Upgrade now
                </NavLink>
              </p>
            </div>
          </div>
        )}
        
        {business && business.subscription_status === 'suspended' && (
          <div className="bg-dashboard-dangerBg border-l-4 border-dashboard-dangerText p-4 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-center">
              <span className="text-dashboard-dangerText mr-3">🚨</span>
              <p className="text-sm font-medium text-red-800">
                Your subscription is suspended due to payment failure. Your booking page is temporarily unavailable. {' '}
                <NavLink to="/dashboard/billing" className="font-bold underline text-red-900 hover:text-red-700">
                  Update payment details
                </NavLink>
              </p>
            </div>
          </div>
        )}

        <div className="page-enter flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
