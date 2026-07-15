import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export default function OnboardingWizard() {
  const { business, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [brandData, setBrandData] = useState({
    brandColour: '#1A56DB',
    description: '',
    logoUrl: '',
    coverImageUrl: ''
  });

  // Step 2 State
  const [outletData, setOutletData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    managerName: '',
    managerPhone: '',
    totalTables: 10
  });

  // Step 3 State
  const [newOutletId, setNewOutletId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [customTime, setCustomTime] = useState('');
  const [customCovers, setCustomCovers] = useState(20);

  useEffect(() => {
    // If business is fully onboarded, redirect away (simple check: if description is filled)
    // For this wizard, we can let them finish if they landed here manually.
  }, []);

  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      
      // Simulate image upload delays
      let logo = brandData.logoUrl;
      let cover = brandData.coverImageUrl;
      if (e.target.logoInput.files[0]) {
        toast('Uploading logo (mock)...');
        await new Promise(r => setTimeout(r, 800));
        logo = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
      }
      if (e.target.coverInput.files[0]) {
        toast('Uploading cover (mock)...');
        await new Promise(r => setTimeout(r, 800));
        cover = 'https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg';
      }

      await axios.put('/api/business/onboarding/brand', {
        brandColour: brandData.brandColour,
        description: brandData.description,
        logoUrl: logo,
        coverImageUrl: cover
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      await refreshUser(); // Update context
      setStep(2);
    } catch (err) {
      toast.error('Failed to save brand settings');
    } finally {
      setLoading(false);
    }
  };

  const handleOutletSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.post('/api/outlets', outletData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewOutletId(res.data.data.outlet.id);
      setStep(3);
    } catch (err) {
      toast.error('Failed to create outlet');
    } finally {
      setLoading(false);
    }
  };

  const addPreset = (presetType) => {
    const defaultCovers = 20;
    if (presetType === 'Lunch') {
      setSlots(prev => [...prev, 
        { label: '12:00 PM', maxCovers: defaultCovers },
        { label: '1:00 PM', maxCovers: defaultCovers },
        { label: '2:00 PM', maxCovers: defaultCovers },
      ]);
    } else if (presetType === 'Dinner') {
      setSlots(prev => [...prev, 
        { label: '7:00 PM', maxCovers: defaultCovers },
        { label: '8:00 PM', maxCovers: defaultCovers },
        { label: '9:00 PM', maxCovers: defaultCovers },
        { label: '10:00 PM', maxCovers: defaultCovers },
      ]);
    }
  };

  const addCustomSlot = () => {
    if (!customTime) return toast.error('Enter a time');
    setSlots(prev => [...prev, { label: customTime, maxCovers: Number(customCovers) }]);
    setCustomTime('');
  };

  const removeSlot = (index) => {
    setSlots(prev => prev.filter((_, i) => i !== index));
  };

  const handleSlotsSubmit = async () => {
    if (slots.length === 0) return toast.error('Add at least one time slot');
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('/api/slots/bulk', {
        outletId: newOutletId,
        slots: slots
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStep(4);
    } catch (err) {
      toast.error('Failed to save slots');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  const renderStepIcon = (num) => (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= num ? 'bg-dashboard-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
      {num}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to TableFlow!</h1>
        <p className="text-gray-500">Let's get your booking page ready in just 4 simple steps.</p>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-10">
        {renderStepIcon(1)}
        <div className={`h-1 w-16 ${step >= 2 ? 'bg-dashboard-primary' : 'bg-gray-200'}`}></div>
        {renderStepIcon(2)}
        <div className={`h-1 w-16 ${step >= 3 ? 'bg-dashboard-primary' : 'bg-gray-200'}`}></div>
        {renderStepIcon(3)}
        <div className={`h-1 w-16 ${step >= 4 ? 'bg-dashboard-primary' : 'bg-gray-200'}`}></div>
        {renderStepIcon(4)}
      </div>

      <div className="dashboard-card p-8 shadow-md border border-gray-200">
        
        {step === 1 && (
          <form onSubmit={handleBrandSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 1: Brand Setup</h2>
            <p className="text-gray-500 text-sm">Customize how your booking page looks to customers.</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Logo (Optional)</label>
                <input name="logoInput" type="file" accept="image/png, image/jpeg, image/webp" className="w-full text-gray-700 bg-white border border-gray-300 rounded file:mr-4 file:py-2 file:px-4 file:rounded-l file:border-0 file:bg-dashboard-primary/10 file:text-dashboard-primary hover:file:bg-dashboard-primary/20" />
                <p className="text-xs text-gray-500 mt-1">Max 2MB (jpg/png/webp)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover Image (Optional)</label>
                <input name="coverInput" type="file" accept="image/png, image/jpeg, image/webp" className="w-full text-gray-700 bg-white border border-gray-300 rounded file:mr-4 file:py-2 file:px-4 file:rounded-l file:border-0 file:bg-dashboard-primary/10 file:text-dashboard-primary hover:file:bg-dashboard-primary/20" />
                <p className="text-xs text-gray-500 mt-1">Max 5MB (jpg/png/webp)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Colour</label>
                <div className="flex items-center space-x-3">
                  <input type="color" value={brandData.brandColour} onChange={e => setBrandData({...brandData, brandColour: e.target.value})} className="h-10 w-10 bg-white border border-gray-300 rounded cursor-pointer" />
                  <span className="text-gray-700 font-medium">{brandData.brandColour}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
              <textarea 
                value={brandData.description} 
                onChange={e => setBrandData({...brandData, description: e.target.value})} 
                className="w-full dashboard-input h-24 resize-none"
                placeholder="A cozy cafe serving the best coffee in town..."
                maxLength="200"
                required
              />
              <p className="text-xs text-gray-500 mt-1 text-right">{brandData.description.length}/200</p>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100">
              <button type="submit" disabled={loading} className="btn-dashboard-primary px-8">
                {loading ? 'Saving...' : 'Next Step →'}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOutletSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 2: First Outlet</h2>
            <p className="text-gray-500 text-sm">Set up your main physical location.</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Outlet Name</label>
                <input type="text" required value={outletData.name} onChange={e => setOutletData({...outletData, name: e.target.value})} className="dashboard-input" placeholder="Main Branch" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input type="text" required value={outletData.city} onChange={e => setOutletData({...outletData, city: e.target.value})} className="dashboard-input" placeholder="Mumbai" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Address</label>
              <textarea required value={outletData.address} onChange={e => setOutletData({...outletData, address: e.target.value})} className="dashboard-input resize-none" placeholder="123 Street Name..." />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Outlet Phone</label>
                <input type="text" value={outletData.phone} onChange={e => setOutletData({...outletData, phone: e.target.value})} className="dashboard-input" placeholder="022-12345678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Tables</label>
                <input type="number" required min="1" value={outletData.totalTables} onChange={e => setOutletData({...outletData, totalTables: e.target.value})} className="dashboard-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager Name (Optional)</label>
                <input type="text" value={outletData.managerName} onChange={e => setOutletData({...outletData, managerName: e.target.value})} className="dashboard-input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Manager Phone (Optional)</label>
                <input type="text" value={outletData.managerPhone} onChange={e => setOutletData({...outletData, managerPhone: e.target.value})} className="dashboard-input" />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setStep(1)} className="btn-dashboard-secondary">← Back</button>
              <button type="submit" disabled={loading} className="btn-dashboard-primary px-8">
                {loading ? 'Saving...' : 'Next Step →'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Step 3: Time Slots</h2>
            <p className="text-gray-500 text-sm">When can customers book a table? (You can add more later)</p>
            
            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Add Presets</h3>
              <div className="flex space-x-4">
                <button onClick={() => addPreset('Lunch')} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md border border-gray-300 text-sm flex items-center shadow-sm">
                  <span className="mr-2">☀️</span> Add Lunch (12-2 PM)
                </button>
                <button onClick={() => addPreset('Dinner')} className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md border border-gray-300 text-sm flex items-center shadow-sm">
                  <span className="mr-2">🌙</span> Add Dinner (7-10 PM)
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Or Add Custom Time</h3>
              <div className="flex space-x-3 items-end">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time (e.g. 5:30 PM)</label>
                  <input type="text" value={customTime} onChange={e => setCustomTime(e.target.value)} placeholder="5:30 PM" className="dashboard-input" />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Covers</label>
                  <input type="number" value={customCovers} onChange={e => setCustomCovers(e.target.value)} className="dashboard-input" />
                </div>
                <button onClick={addCustomSlot} className="btn-dashboard-secondary h-[42px]">
                  Add
                </button>
              </div>
            </div>

            {slots.length > 0 && (
              <div className="mt-6 p-5 border border-dashboard-primary/20 bg-dashboard-primary/5 rounded-lg">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Your Slots</h3>
                <div className="flex flex-wrap gap-2">
                  {slots.map((s, idx) => (
                    <div key={idx} className="bg-white border border-dashboard-primary text-dashboard-primary font-medium px-3 py-1.5 rounded-full text-sm flex items-center shadow-sm">
                      <span>{s.label} ({s.maxCovers} covers)</span>
                      <button onClick={() => removeSlot(idx)} className="ml-2 text-dashboard-primary hover:text-red-600 font-bold bg-dashboard-primary/10 w-5 h-5 rounded-full flex items-center justify-center">&times;</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
              <button type="button" onClick={() => setStep(2)} className="btn-dashboard-secondary">← Back</button>
              <button onClick={handleSlotsSubmit} disabled={loading || slots.length===0} className="btn-dashboard-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Finish Setup →'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border-4 border-green-50 shadow-sm">
              ✓
            </div>
            <h2 className="text-3xl font-bold text-gray-900">You're live!</h2>
            <p className="text-gray-500 text-lg">Your booking page is ready to accept reservations.</p>
            
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 inline-block text-left w-full max-w-md shadow-sm">
              <label className="block text-sm font-bold text-gray-900 mb-2">Share your booking link:</label>
              <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden mb-6 shadow-sm">
                <input type="text" readOnly value={`https://${business?.slug}.tableflow.in`} className="flex-1 bg-transparent px-4 py-2.5 text-dashboard-primary outline-none text-sm font-medium" />
                <button onClick={() => {
                  navigator.clipboard.writeText(`https://${business?.slug}.tableflow.in`);
                  toast.success('Copied to clipboard');
                }} className="bg-gray-100 hover:bg-gray-200 border-l border-gray-300 px-5 text-gray-700 text-sm font-bold transition-colors">Copy</button>
              </div>

              <a 
                href={`https://wa.me/?text=Book%20a%20table%20at%20${business?.name}!%20https://${business?.slug}.tableflow.in`} 
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold shadow-sm transition-colors"
              >
                Share on WhatsApp
              </a>
              
              <div className="mt-6 border-t border-gray-200 pt-5">
                <label className="block text-sm font-bold text-gray-900 mb-2">Embed on your website:</label>
                <div className="relative">
                  <textarea readOnly className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-600 font-mono text-xs h-20 outline-none resize-none focus:border-dashboard-primary focus:ring-1 focus:ring-dashboard-primary shadow-sm" value={`<iframe src="https://${business?.slug}.tableflow.in/embed" width="100%" height="600" frameBorder="0"></iframe>`}></textarea>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button onClick={handleFinish} className="btn-dashboard-primary px-8 py-3 text-lg">
                Go to Dashboard →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
