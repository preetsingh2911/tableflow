import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Section */}
      <section className="relative pt-24 pb-32 px-6 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px]" />
          <div className="absolute top-60 -left-40 w-[400px] h-[400px] bg-primary-500/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 font-display animate-slide-up text-white">
            Your own table booking system. <br/>
            <span className="text-primary-500">No middleman.</span>
          </h1>

          <p className="text-xl md:text-2xl text-surface-300 max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Stop paying Dineout. Own your bookings, your brand, and your customers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register" className="btn-primary text-lg !py-4 !px-8 w-full sm:w-auto shadow-glow shadow-primary-500/30">
              Start free — 14 days trial, no card needed
            </Link>
          </div>
          
          {/* Mockup visual */}
          <div className="mt-20 mx-auto max-w-4xl animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="relative rounded-t-3xl overflow-hidden border border-white/10 shadow-2xl bg-surface-900 mx-4 md:mx-0">
              <div className="bg-surface-800 px-4 py-3 flex items-center gap-2 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <div className="ml-4 text-xs text-surface-400 font-mono">poppindeli.tableflow.in</div>
              </div>
              <div className="aspect-[16/9] bg-surface-950 relative overflow-hidden flex flex-col">
                <div className="h-1/2 bg-surface-800 relative">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                </div>
                <div className="h-1/2 bg-surface-950 flex justify-center pt-8">
                  <div className="w-20 h-20 bg-surface-800 rounded-2xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center text-3xl shadow-lg border border-white/10">🍕</div>
                  <div className="text-center mt-6">
                    <div className="text-2xl font-bold font-display text-white">Poppin Deli</div>
                    <div className="text-surface-400 text-sm mt-1">Italian • Indiranagar, Bangalore</div>
                    <div className="mt-4 inline-block px-6 py-2 rounded-full bg-white text-black font-semibold text-sm">Reserve a Table</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Problem Section - Big Visual Risk */}
      <section className="py-24 px-6 bg-surface-900/50 border-y border-white/5 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-2xl md:text-3xl font-semibold text-surface-300 mb-8 font-display">
            ₹3,000/month to Dineout. For every outlet. Forever.
          </h2>
          
          <div className="text-[12vw] md:text-[8rem] font-black text-red-500 leading-none mb-4 font-display opacity-90 drop-shadow-lg">
            -₹1,08,000<span className="text-3xl md:text-5xl text-surface-500 font-normal">/yr</span>
          </div>
          
          <p className="text-xl md:text-2xl text-surface-300 font-medium">
            (Based on 3 outlets). And they own your customers. You don't.
          </p>
        </div>
      </section>

      {/* 3. Solution Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-display">
              TableFlow gives you your own booking page in 10 minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center text-2xl font-bold font-display text-primary-400 mb-6">1</div>
              <h3 className="text-xl font-bold text-white mb-3">Sign up</h3>
              <p className="text-surface-400">Create your account in seconds. No credit card required.</p>
            </div>
            
            <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center text-2xl font-bold font-display text-primary-400 mb-6">2</div>
              <h3 className="text-xl font-bold text-white mb-3">Set up your brand</h3>
              <p className="text-surface-400">Add your logo, cover photo, brand color, and time slots.</p>
            </div>

            <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
              <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center text-2xl font-bold font-display text-primary-400 mb-6">3</div>
              <h3 className="text-xl font-bold text-white mb-3">Share your link</h3>
              <p className="text-surface-400">Put it on your Instagram, Google Maps, or embed on your website.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section className="py-24 px-6 bg-surface-900/30">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-2">Branded booking page</h3>
              <p className="text-surface-400 leading-relaxed">Your logo, your colours, your domain. It looks and feels exactly like your restaurant.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4">💬</div>
              <h3 className="text-xl font-bold text-white mb-2">WhatsApp + Email</h3>
              <p className="text-surface-400 leading-relaxed">Instant alerts for you and your customers when a booking is made or updated.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4">🏢</div>
              <h3 className="text-xl font-bold text-white mb-2">Multi-outlet support</h3>
              <p className="text-surface-400 leading-relaxed">Manage all your branches from a single unified dashboard seamlessly.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4">⏰</div>
              <h3 className="text-xl font-bold text-white mb-2">No-show reminders</h3>
              <p className="text-surface-400 leading-relaxed">Automatic WhatsApp reminders sent to customers drastically reduce no-shows.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
              <p className="text-surface-400 leading-relaxed">See your busiest hours, track no-show rates, and own your customer data forever.</p>
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center text-2xl mb-4">💻</div>
              <h3 className="text-xl font-bold text-white mb-2">Works on any website</h3>
              <p className="text-surface-400 leading-relaxed">Have an existing website? Embed our booking widget with just 2 lines of code.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">Simple, transparent pricing</h2>
            <p className="text-xl text-surface-400">Zero commission on your bookings. Ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {/* Starter */}
            <div className="glass-card p-8 border-surface-700">
              <h3 className="text-2xl font-bold text-white mb-2 font-display">Starter</h3>
              <p className="text-surface-400 mb-6">Perfect for small cafes</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₹999</span>
                <span className="text-surface-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8 text-surface-300">
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> 1 Outlet</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Up to 100 bookings/month</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Email Notifications</li>
              </ul>
              <Link to="/register" className="btn-secondary w-full block text-center">Start Free Trial</Link>
            </div>

            {/* Growth */}
            <div className="glass-card p-8 border-primary-500/50 shadow-glow relative transform md:scale-105 z-10 bg-surface-900">
              <div className="absolute -top-4 inset-x-0 text-center">
                <span className="bg-primary-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 font-display">Growth</h3>
              <p className="text-surface-400 mb-6">For growing restaurants</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₹2,499</span>
                <span className="text-surface-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8 text-surface-300">
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Up to 5 Outlets</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Unlimited bookings</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> WhatsApp Notifications</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Analytics Dashboard</li>
              </ul>
              <Link to="/register" className="btn-primary w-full block text-center">Start Free Trial</Link>
            </div>

            {/* Franchise */}
            <div className="glass-card p-8 border-surface-700">
              <h3 className="text-2xl font-bold text-white mb-2 font-display">Franchise</h3>
              <p className="text-surface-400 mb-6">For restaurant chains</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">₹5,999</span>
                <span className="text-surface-400">/month</span>
              </div>
              <ul className="space-y-4 mb-8 text-surface-300">
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Unlimited Outlets</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> Unlimited bookings</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> White-label solution</li>
                <li className="flex items-center gap-3"><span className="text-primary-400">✓</span> API Access</li>
              </ul>
              <Link to="/register" className="btn-secondary w-full block text-center">Start Free Trial</Link>
            </div>
          </div>

          {/* FAQ Accordion */}
          <div className="max-w-3xl mx-auto mt-24">
            <h3 className="text-3xl font-bold text-center text-white mb-10 font-display">Frequently Asked Questions</h3>
            <div className="space-y-4">
              <div className="glass-card p-6 border-surface-800">
                <h4 className="font-bold text-lg text-white mb-2">Do you charge commissions per booking?</h4>
                <p className="text-surface-400">Never. We only charge a flat monthly fee based on your subscription plan. You keep 100% of your revenue and control your customer data.</p>
              </div>
              <div className="glass-card p-6 border-surface-800">
                <h4 className="font-bold text-lg text-white mb-2">Do I need a credit card for the free trial?</h4>
                <p className="text-surface-400">No. You can sign up and use all features of the Franchise plan for 14 days completely free without entering any payment details.</p>
              </div>
              <div className="glass-card p-6 border-surface-800">
                <h4 className="font-bold text-lg text-white mb-2">Can I cancel anytime?</h4>
                <p className="text-surface-400">Yes, there are no lock-in contracts. You can cancel your subscription at any time from your dashboard.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Social Proof */}
      <section className="py-24 px-6 bg-surface-900/30 border-y border-white/5">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Trusted by cafes in Bhopal, Indore, Patna and growing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16 text-left">
            <div className="glass-card p-8 border-surface-800 relative">
              <div className="text-4xl text-primary-500/20 absolute top-4 right-6 font-serif">"</div>
              <p className="text-surface-300 italic mb-6">"Switching to TableFlow saved us nearly ₹15,000 a month in aggregator fees. Plus, we actually have the phone numbers of our regulars now."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-white font-bold">R</div>
                <div>
                  <div className="text-white font-bold text-sm">Rahul S.</div>
                  <div className="text-surface-500 text-xs">Owner, The Roastery (Indore)</div>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-8 border-surface-800 relative">
              <div className="text-4xl text-primary-500/20 absolute top-4 right-6 font-serif">"</div>
              <p className="text-surface-300 italic mb-6">"The WhatsApp notifications are brilliant. Our no-show rate dropped from 15% to almost zero in the first month of using it."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-white font-bold">P</div>
                <div>
                  <div className="text-white font-bold text-sm">Priya M.</div>
                  <div className="text-surface-500 text-xs">Manager, Cafe Azure (Bhopal)</div>
                </div>
              </div>
            </div>

            <div className="glass-card p-8 border-surface-800 relative hidden lg:block">
              <div className="text-4xl text-primary-500/20 absolute top-4 right-6 font-serif">"</div>
              <p className="text-surface-300 italic mb-6">"It took exactly 10 minutes to set up. We put the link in our Instagram bio and bookings started rolling in the same evening."</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-700 flex items-center justify-center text-white font-bold">V</div>
                <div>
                  <div className="text-white font-bold text-sm">Vikram K.</div>
                  <div className="text-surface-500 text-xs">Founder, Slice & Dice (Patna)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final CTA */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[100px]" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6 font-display">Ready to own your bookings?</h2>
          <p className="text-xl text-surface-300 mb-10">Start your free 14-day trial — no credit card, cancel anytime.</p>
          <Link to="/register" className="btn-primary text-xl !py-5 !px-12 inline-block shadow-glow shadow-primary-500/40">
            Get started free
          </Link>
        </div>
      </section>
    </div>
  );
}
