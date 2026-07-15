import { Link } from 'react-router-dom';

export default function PricingPage() {
  return (
    <div className="py-24 px-6 flex flex-col items-center">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 font-display">Simple, honest pricing</h1>
        <p className="text-xl text-surface-300">
          No hidden fees, no per-booking commissions. Pick a plan that fits your business size.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto mb-20">
        {/* Starter */}
        <div className="glass-card p-8 border-surface-700 flex flex-col">
          <h3 className="text-2xl font-bold text-white mb-2 font-display">Starter</h3>
          <p className="text-surface-400 mb-6">Perfect for small, single-location cafes</p>
          <div className="mb-8">
            <span className="text-5xl font-bold text-white">₹999</span>
            <span className="text-surface-400">/month</span>
          </div>
          <Link to="/register" className="btn-secondary w-full text-center py-4 mb-8">Start Free Trial</Link>
          
          <div className="flex-grow">
            <p className="font-semibold text-white mb-4">Includes:</p>
            <ul className="space-y-4 text-surface-300">
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">1 Outlet</span>
                  <p className="text-sm text-surface-500 mt-1">Manage a single location</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">100 Bookings / month</span>
                  <p className="text-sm text-surface-500 mt-1">Online and manual bookings</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">Branded Booking Page</span>
                  <p className="text-sm text-surface-500 mt-1">Add your logo and colors</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">Email Notifications</span>
                  <p className="text-sm text-surface-500 mt-1">For you and your customers</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Growth */}
        <div className="glass-card p-8 border-primary-500/50 shadow-glow relative transform lg:scale-105 z-10 bg-surface-900 flex flex-col">
          <div className="absolute -top-4 inset-x-0 text-center">
            <span className="bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider">Most Popular</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2 font-display">Growth</h3>
          <p className="text-surface-400 mb-6">For busy restaurants that need more</p>
          <div className="mb-8">
            <span className="text-5xl font-bold text-white">₹2,499</span>
            <span className="text-surface-400">/month</span>
          </div>
          <Link to="/register" className="btn-primary w-full text-center py-4 mb-8 text-lg">Start Free Trial</Link>
          
          <div className="flex-grow">
            <p className="font-semibold text-white mb-4">Everything in Starter, plus:</p>
            <ul className="space-y-4 text-surface-300">
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">Up to 5 Outlets</span>
                  <p className="text-sm text-surface-500 mt-1">Manage multiple branches</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">Unlimited Bookings</span>
                  <p className="text-sm text-surface-500 mt-1">No monthly caps</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">WhatsApp Notifications</span>
                  <p className="text-sm text-surface-500 mt-1">Instant alerts & reminders</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">Analytics Dashboard</span>
                  <p className="text-sm text-surface-500 mt-1">Track your performance</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Franchise */}
        <div className="glass-card p-8 border-surface-700 flex flex-col">
          <h3 className="text-2xl font-bold text-white mb-2 font-display">Franchise</h3>
          <p className="text-surface-400 mb-6">For large restaurant chains & groups</p>
          <div className="mb-8">
            <span className="text-5xl font-bold text-white">₹5,999</span>
            <span className="text-surface-400">/month</span>
          </div>
          <Link to="/register" className="btn-secondary w-full text-center py-4 mb-8">Start Free Trial</Link>
          
          <div className="flex-grow">
            <p className="font-semibold text-white mb-4">Everything in Growth, plus:</p>
            <ul className="space-y-4 text-surface-300">
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">Unlimited Outlets</span>
                  <p className="text-sm text-surface-500 mt-1">Scale without limits</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">White-label Solution</span>
                  <p className="text-sm text-surface-500 mt-1">Remove TableFlow branding</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">HQ Dashboard</span>
                  <p className="text-sm text-surface-500 mt-1">Centralized franchise reporting</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary-400 mt-1">✓</span> 
                <div>
                  <span className="text-white font-medium">API Access</span>
                  <p className="text-sm text-surface-500 mt-1">Integrate with POS systems</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
