import { Link, Outlet } from 'react-router-dom';

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col font-sans text-surface-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="text-xl font-bold font-display text-white">TableFlow</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link to="/pricing" className="text-surface-300 hover:text-white transition-colors">Pricing</Link>
            <Link to="/demo" className="text-surface-300 hover:text-white transition-colors">Demo</Link>
            <Link to="/contact" className="text-surface-300 hover:text-white transition-colors">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-surface-300 hover:text-white transition-colors font-medium text-sm">
              Login
            </Link>
            <Link to="/register" className="btn-primary text-sm !py-2 !px-5 shadow-glow">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content (Outlet) */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 bg-surface-900/50 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍽️</span>
              <span className="text-xl font-bold font-display text-white">TableFlow</span>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-surface-400 text-sm">
              <Link to="/" className="hover:text-primary-400 transition-colors">Home</Link>
              <Link to="/pricing" className="hover:text-primary-400 transition-colors">Pricing</Link>
              <Link to="/privacy" className="hover:text-primary-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-primary-400 transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-primary-400 transition-colors">Contact</Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-surface-500 text-sm">
            <p>&copy; {new Date().getFullYear()} Shyara Tech Solution (OPC) Pvt. Ltd. All rights reserved.</p>
            <p className="mt-2 text-xs">Built for Indian Cafes & Restaurants</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
