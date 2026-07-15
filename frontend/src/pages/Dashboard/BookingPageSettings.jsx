import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { businessAPI } from '../../api';
import toast from 'react-hot-toast';

export default function BookingPageSettings() {
  const { business, updateBusinessData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    brandColour: '#1A56DB',
    description: '',
    instagramUrl: '',
    googleMapsUrl: '',
    confirmationMessage: '',
    requireDeposit: false,
    depositAmount: '',
    allowWaitlist: false
  });

  useEffect(() => {
    if (business) {
      setForm({
        brandColour: business.brand_colour || '#1A56DB',
        description: business.description || '',
        instagramUrl: business.instagram_url || '',
        googleMapsUrl: business.google_maps_url || '',
        confirmationMessage: business.confirmation_message || '',
        requireDeposit: Boolean(business.require_deposit),
        depositAmount: business.deposit_amount || '',
        allowWaitlist: Boolean(business.allow_waitlist)
      });
    }
  }, [business]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await businessAPI.updateProfile(form);
      updateBusinessData(data.data.business);
      toast.success('Booking page settings saved!');
    } catch (err) {
      toast.error('Failed to save settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const bookingUrl = `https://${business?.slug}.tableflow.in`;
  const embedCode = `<iframe src="${bookingUrl}" width="100%" height="800" style="border:none; border-radius: 8px;"></iframe>`;

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Settings Form */}
      <div className="flex-1 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Page</h1>
          <p className="text-gray-500 mt-1">Customize how your booking page looks to customers.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Brand Aesthetics */}
          <div className="dashboard-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Brand Aesthetics</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand Colour</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={form.brandColour}
                    onChange={(e) => setForm({...form, brandColour: e.target.value})}
                    className="w-12 h-12 rounded cursor-pointer bg-white border border-gray-300 p-1"
                  />
                  <input 
                    type="text" 
                    value={form.brandColour}
                    onChange={(e) => setForm({...form, brandColour: e.target.value})}
                    className="dashboard-input font-mono w-32"
                    pattern="^#[0-9A-Fa-f]{6}$"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <textarea 
                  rows="3"
                  className="dashboard-input resize-none"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Welcome to our restaurant! Please book your table below."
                ></textarea>
              </div>
              
              <div className="p-4 bg-dashboard-primary/5 border border-dashboard-primary/20 rounded-lg text-sm text-dashboard-primary">
                <span className="font-bold block mb-1">Uploads</span>
                Logo and Cover Image uploading is disabled in the local development environment. It will be available once Cloudinary is configured in production.
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="dashboard-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Social & Location</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    instagram.com/
                  </span>
                  <input 
                    type="text" 
                    className="dashboard-input !rounded-l-none"
                    value={form.instagramUrl?.replace('https://instagram.com/', '')}
                    onChange={(e) => setForm({...form, instagramUrl: e.target.value ? `https://instagram.com/${e.target.value}` : ''})}
                    placeholder="yourhandle"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input 
                  type="url" 
                  className="dashboard-input"
                  value={form.googleMapsUrl}
                  onChange={(e) => setForm({...form, googleMapsUrl: e.target.value})}
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </div>

          {/* Booking Rules */}
          <div className="dashboard-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Rules</h2>
            
            <div className="space-y-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={form.allowWaitlist}
                  onChange={(e) => setForm({...form, allowWaitlist: e.target.checked})}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-dashboard-primary focus:ring-dashboard-primary"
                />
                <div>
                  <span className="block text-sm font-bold text-gray-900">Enable Waitlist</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Allow customers to join a waitlist when a time slot is fully booked.</span>
                </div>
              </label>

              <div className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50 shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.requireDeposit}
                    onChange={(e) => setForm({...form, requireDeposit: e.target.checked})}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-dashboard-primary focus:ring-dashboard-primary"
                  />
                  <div>
                    <span className="block text-sm font-bold text-gray-900">Require Deposit</span>
                    <span className="block text-xs text-gray-500 mt-0.5">Collect an upfront payment to secure the booking.</span>
                  </div>
                </label>

                {form.requireDeposit && (
                  <div className="pl-8 pt-2 transition-all">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deposit Amount (₹)</label>
                    <input 
                      type="number" 
                      min="1"
                      required={form.requireDeposit}
                      className="dashboard-input w-32"
                      value={form.depositAmount}
                      onChange={(e) => setForm({...form, depositAmount: e.target.value})}
                      placeholder="e.g. 500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="dashboard-card p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmation Message</h2>
            <p className="text-sm text-gray-500 mb-4">This message is shown to the customer immediately after they successfully book.</p>
            
            <textarea 
              rows="3"
              className="dashboard-input resize-none"
              value={form.confirmationMessage}
              onChange={(e) => setForm({...form, confirmationMessage: e.target.value})}
              placeholder="e.g. Please dress smart casual. We can hold your table for a maximum of 15 minutes."
            ></textarea>
          </div>

          <div className="flex justify-end pt-4 pb-12">
            <button type="submit" disabled={loading} className="btn-dashboard-primary px-8">
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Sharing & Preview Sidebar */}
      <div className="w-full lg:w-[400px] xl:w-[450px] shrink-0 space-y-6">
        
        {/* Share Links */}
        <div className="dashboard-card p-6 sticky top-8 border-t-4 border-t-dashboard-primary">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Share & Embed</h2>
          
          <div className="space-y-5">
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">Direct Link</p>
              <div className="flex gap-2">
                <input type="text" readOnly value={bookingUrl} className="dashboard-input flex-1 text-sm text-dashboard-primary font-medium" />
                <button onClick={() => handleCopy(bookingUrl)} className="btn-dashboard-secondary !p-2 px-3" title="Copy link">📋</button>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="btn-dashboard-primary !p-2 px-3 flex items-center justify-center" title="Open in new tab">↗</a>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2 flex justify-between">
                <span>Website Embed Code</span>
                <button type="button" onClick={() => handleCopy(embedCode)} className="text-dashboard-primary hover:text-blue-700 text-xs font-semibold">Copy Code</button>
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 font-mono break-all max-h-24 overflow-y-auto shadow-inner">
                {embedCode}
              </div>
              <p className="text-xs text-gray-500 mt-2">Paste this HTML anywhere on your website to show the booking widget directly.</p>
            </div>
          </div>
          
          <hr className="border-gray-200 my-6" />

          {/* Live Preview (Simulated) */}
          <h2 className="text-lg font-bold text-gray-900 mb-4">Live Preview</h2>
          <div className="border-[6px] border-gray-900 rounded-2xl overflow-hidden shadow-2xl relative bg-white mx-auto max-w-[320px] aspect-[9/19]">
            {/* Mock Header */}
            <div 
              className="h-32 bg-cover bg-center flex items-end p-4 transition-colors"
              style={{ backgroundColor: form.brandColour }}
            >
              <div className="bg-white/90 backdrop-blur rounded p-2 shadow">
                <h3 className="font-bold text-gray-900">{business?.name || 'Your Business'}</h3>
              </div>
            </div>
            {/* Mock Body */}
            <div className="p-4 bg-white space-y-4">
              <div className="h-4 bg-gray-100 rounded w-3/4"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              
              <div className="grid grid-cols-2 gap-2 pt-4">
                <div className="h-10 border border-gray-200 rounded flex items-center justify-center">📅</div>
                <div className="h-10 border border-gray-200 rounded flex items-center justify-center">👥</div>
              </div>
              
              <div className="h-12 rounded mt-6 opacity-90 transition-colors" style={{ backgroundColor: form.brandColour }}></div>
            </div>
            
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="bg-gray-900 text-white font-bold text-sm px-6 py-2 rounded-full shadow-lg hover:bg-gray-800">
                View Full Page
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
