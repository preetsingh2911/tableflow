import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate sending email to platform admin
    setTimeout(() => {
      setSubmitted(true);
    }, 500);
  };

  return (
    <div className="py-24 px-6 flex flex-col items-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">Contact Us</h1>
          <p className="text-surface-400">Have questions about TableFlow? We're here to help.</p>
        </div>

        {submitted ? (
          <div className="glass-card p-10 text-center bg-surface-900 border-emerald-500/30">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Message Sent!</h2>
            <p className="text-surface-400 mb-6">Thank you for reaching out. Our team will get back to you shortly.</p>
            <button onClick={() => setSubmitted(false)} className="text-primary-400 hover:text-white transition-colors">
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-card p-8 bg-surface-900 border-surface-800 space-y-6">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Your Name</label>
              <input 
                required 
                type="text" 
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="glass-input bg-surface-950 border-surface-700" 
                placeholder="Rahul Sharma" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Email Address</label>
              <input 
                required 
                type="email" 
                value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                className="glass-input bg-surface-950 border-surface-700" 
                placeholder="rahul@cafe.com" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Message</label>
              <textarea 
                required 
                value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                className="glass-input bg-surface-950 border-surface-700 resize-none h-32" 
                placeholder="How can we help you?" 
              />
            </div>
            <button type="submit" className="btn-primary w-full py-4 text-lg">Send Message</button>
          </form>
        )}
      </div>
    </div>
  );
}
