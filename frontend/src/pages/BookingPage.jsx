import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicAPI } from '../api';
import toast from 'react-hot-toast';

// Helper for generating calendar days
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

export default function BookingPage() {
  const { slug } = useParams();
  const [business, setBusiness] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  
  // Navigation / Scroll State
  const [step, setStep] = useState(0); 
  // steps: 0 = Outlet, 1 = Date, 2 = Time, 3 = Details, 4 = Confirm, 5 = Success

  // Booking Data
  const [selectedOutlet, setSelectedOutlet] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availability, setAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    guestCount: 2,
    occasion: 'None',
    occasionDetails: '',
    specialRequests: '',
    agreePolicy: false
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);

  // Calendar State
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  useEffect(() => {
    loadBusiness();
  }, [slug]);

  const loadBusiness = async () => {
    try {
      const { data } = await publicAPI.getBusinessInfo(slug);
      setBusiness(data.data.business);
      setOutlets(data.data.outlets);
      if (data.data.outlets.length === 1) {
        handleOutletSelect(data.data.outlets[0]);
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setUnavailable(true);
      } else {
        toast.error('Business not found.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOutletSelect = async (outlet) => {
    setSelectedOutlet(outlet);
    setStep(1);
    try {
      const { data } = await publicAPI.getBlockedDates(slug, outlet.id);
      setBlockedDates(data.data.blockedDates.map(d => new Date(d.date).toISOString().split('T')[0]));
    } catch {
      // ignore
    }
  };

  const handleDateSelect = async (dateStr) => {
    setSelectedDate(dateStr);
    setStep(2);
    setAvailability(null);
    try {
      const { data } = await publicAPI.getAvailability(slug, selectedOutlet.id, dateStr);
      setAvailability(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load availability.');
    }
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!form.agreePolicy) {
      toast.error('Please agree to the cancellation policy.');
      return;
    }
    setSubmitting(true);
    try {
      // Mock Razorpay payment delay if deposit required
      if (business.require_deposit) {
        toast.loading('Processing payment deposit...', { id: 'payment' });
        await new Promise(resolve => setTimeout(resolve, 1500));
        toast.dismiss('payment');
      }

      let res;
      if (selectedSlot.waitlistOnly) {
        res = await publicAPI.joinWaitlist(slug, {
          outletId: selectedOutlet.id,
          timeSlotId: selectedSlot.id,
          bookingDate: selectedDate,
          ...form,
          specialRequests: `[${form.occasion}] ${form.occasionDetails} - ${form.specialRequests}`
        });
      } else {
        res = await publicAPI.createBooking(slug, {
          outletId: selectedOutlet.id,
          timeSlotId: selectedSlot.id,
          bookingDate: selectedDate,
          ...form,
          specialRequests: `[${form.occasion}] ${form.occasionDetails} - ${form.specialRequests}`
        });
      }
      
      setConfirmation(res.data.data);
      setStep(5);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const generateICS = () => {
    // Basic ICS file generation
    if (!confirmation) return;
    const { bookingDate, timeSlot, businessName, outletName } = confirmation;
    const [start] = timeSlot.split(' – ');
    const startDate = new Date(`${bookingDate}T${start}:00`);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // 2 hours default
    
    const formatDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:Table Reservation at ${businessName}
LOCATION:${outletName}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reservation-${businessName.replace(/\s+/g, '')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="spinner border-t-white" />
      </div>
    );
  }

  if (unavailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="text-6xl mb-4">⏸️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Temporarily Unavailable</h1>
          <p className="text-surface-400">This business is currently unable to accept online bookings.</p>
          <p className="text-surface-500 text-sm mt-4">Please contact them directly.</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Business Not Found</h1>
          <p className="text-surface-400">The booking page you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const brandColor = business.brand_color || '#1A56DB';
  
  // Custom Calendar Render Logic
  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      
      today.setHours(0,0,0,0);
      const isPast = date < today;
      const isBlocked = blockedDates.includes(dateStr);
      const isSelected = selectedDate === dateStr;
      
      const disabled = isPast || isBlocked;
      
      days.push(
        <button
          key={d}
          disabled={disabled}
          onClick={() => handleDateSelect(dateStr)}
          className={`h-12 w-12 mx-auto rounded-full flex items-center justify-center font-medium transition-all
            ${disabled ? 'text-surface-600 cursor-not-allowed line-through opacity-50' : 
              isSelected ? 'text-white shadow-lg shadow-black/20 scale-110' : 'text-surface-200 hover:bg-white/10 hover:text-white'
            }`}
          style={isSelected ? { backgroundColor: brandColor } : {}}
        >
          {d}
        </button>
      );
    }
    
    return (
      <div className="glass-card p-6 border-surface-800">
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            disabled={new Date(year, month, 1) <= today}
          >
            ←
          </button>
          <h3 className="text-lg font-bold text-white">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
          >
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-950 font-sans selection:bg-white/20">
      
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        {business.cover_image_url ? (
          <img src={business.cover_image_url} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 bg-surface-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface-950 via-surface-950/60 to-transparent" />
        
        <div className="relative z-10 text-center px-4 animate-slide-up">
          {business.logo_url && (
            <img src={business.logo_url} alt={business.name} className="w-24 h-24 rounded-2xl mx-auto mb-4 object-contain bg-white/5 p-2 shadow-2xl ring-1 ring-white/10 backdrop-blur-md" />
          )}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">{business.name}</h1>
          {business.description && <p className="text-surface-300 max-w-lg mx-auto mb-6">{business.description}</p>}
          
          <button 
            onClick={() => {
              const el = document.getElementById('booking-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-3 rounded-full text-white font-semibold shadow-xl transition-transform hover:scale-105 active:scale-95"
            style={{ backgroundColor: brandColor, boxShadow: `0 10px 30px -10px ${brandColor}` }}
          >
            Reserve a Table
          </button>
        </div>
      </div>

      {/* About Section (Optional) */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
          {business.instagram_url && (
            <a href={business.instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          )}
          {business.google_maps_url && (
            <a href={business.google_maps_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-surface-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Google Maps
            </a>
          )}
        </div>
      </div>

      <div id="booking-section" className="max-w-3xl mx-auto px-4 pb-24">
        
        {/* SUCCESS SCREEN */}
        {step === 5 && confirmation && (
          <div className="glass-card p-10 text-center animate-scale-in border-surface-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: brandColor }} />
            <div className="w-24 h-24 mx-auto bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 animate-bounce-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {confirmation.waitlistStatus ? "You're on the waitlist!" : "Booking Confirmed!"}
            </h2>
            <p className="text-surface-400 mb-8">
              {confirmation.waitlistStatus 
                ? "We will notify you if a table becomes available." 
                : business.confirmation_message || "We look forward to hosting you."}
            </p>

            <div className="bg-surface-900 rounded-2xl p-6 text-left space-y-4 mb-8">
              <div className="flex justify-between items-center border-b border-surface-800 pb-4">
                <span className="text-surface-400">Ref Code</span>
                <span className="text-2xl font-mono font-bold text-white tracking-widest">{confirmation.confirmationCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-sm text-surface-500 mb-1">Date</p>
                  <p className="font-medium text-white">{confirmation.bookingDate}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500 mb-1">Time</p>
                  <p className="font-medium text-white">{confirmation.timeSlot}</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500 mb-1">Guests</p>
                  <p className="font-medium text-white">{confirmation.guestCount} People</p>
                </div>
                <div>
                  <p className="text-sm text-surface-500 mb-1">Location</p>
                  <p className="font-medium text-white truncate">{confirmation.outletName}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={generateICS} className="flex-1 glass-card py-3 hover:bg-white/10 transition-colors text-white font-medium flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                Add to Calendar
              </button>
              <a 
                href={`https://wa.me/?text=I%20just%20booked%20a%20table%20at%20${business.name}%20for%20${confirmation.bookingDate}%20at%20${confirmation.timeSlot}.%20Join%20me!`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 glass-card py-3 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors text-white font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Share
              </a>
            </div>
            
            <button onClick={() => window.location.reload()} className="mt-8 text-surface-400 hover:text-white transition-colors text-sm">
              Make another booking
            </button>
          </div>
        )}

        {/* BOOKING FLOW */}
        {step < 5 && (
          <div className="space-y-8">
            
            {/* 1. OUTLET SELECTOR (Only if > 1) */}
            {outlets.length > 1 && (
              <div className={`transition-opacity duration-500 ${step === 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center text-sm">1</span>
                  Select Location
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {outlets.map(outlet => (
                    <button
                      key={outlet.id}
                      onClick={() => handleOutletSelect(outlet)}
                      className={`glass-card p-5 text-left transition-all ${
                        selectedOutlet?.id === outlet.id ? 'ring-2 ring-white shadow-lg' : 'hover:bg-white/5'
                      }`}
                      style={selectedOutlet?.id === outlet.id ? { ringColor: brandColor } : {}}
                    >
                      <h3 className="text-lg font-bold text-white mb-1">{outlet.name}</h3>
                      <p className="text-surface-400 text-sm">{outlet.address}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. DATE SELECTOR */}
            {(step >= 1 || outlets.length === 1) && (
              <div className={`transition-opacity duration-500 ${step === 1 ? 'opacity-100 animate-slide-up' : step > 1 ? 'opacity-50' : 'hidden'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center text-sm">
                      {outlets.length > 1 ? '2' : '1'}
                    </span>
                    Pick a Date
                  </h2>
                  {step > 1 && (
                    <button onClick={() => setStep(1)} className="text-sm text-surface-400 hover:text-white">Edit</button>
                  )}
                </div>
                
                {step === 1 ? (
                  renderCalendar()
                ) : (
                  <div className="glass-card p-4 flex items-center justify-between border-surface-800 cursor-pointer hover:bg-white/5" onClick={() => setStep(1)}>
                    <span className="text-white font-medium">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                    <span className="text-surface-400">Selected</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. TIME & PARTY */}
            {step >= 2 && availability && (
              <div className={`transition-opacity duration-500 ${step === 2 ? 'opacity-100 animate-slide-up' : step > 2 ? 'opacity-50' : 'hidden'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center text-sm">
                      {outlets.length > 1 ? '3' : '2'}
                    </span>
                    Time & Party Size
                  </h2>
                  {step > 2 && (
                    <button onClick={() => setStep(2)} className="text-sm text-surface-400 hover:text-white">Edit</button>
                  )}
                </div>

                {step === 2 ? (
                  <div className="glass-card p-6 border-surface-800 space-y-8">
                    {/* Guest Counter */}
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-3">How many people?</label>
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setForm(f => ({ ...f, guestCount: Math.max(1, f.guestCount - 1) }))}
                          className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-white/10 text-white text-xl"
                        >-</button>
                        <span className="text-2xl font-bold text-white w-12 text-center">{form.guestCount}</span>
                        <button 
                          onClick={() => setForm(f => ({ ...f, guestCount: Math.min(20, f.guestCount + 1) }))}
                          className="w-12 h-12 rounded-full glass-card flex items-center justify-center hover:bg-white/10 text-white text-xl"
                        >+</button>
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-3">Select a time</label>
                      {availability.slots.length === 0 ? (
                        <p className="text-surface-400">No time slots available on this date.</p>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {availability.slots.map(slot => {
                            const isSelected = selectedSlot?.id === slot.id;
                            const isAvailable = slot.isAvailable;
                            const isWaitlist = !isAvailable && business.allow_waitlist;
                            const isLimited = isAvailable && slot.remaining <= (slot.maxTables * 0.3);

                            let dotColor = 'bg-emerald-500';
                            if (!isAvailable) dotColor = isWaitlist ? 'bg-amber-500' : 'bg-surface-600';
                            else if (isLimited) dotColor = 'bg-amber-400';

                            const disabled = !isAvailable && !isWaitlist;

                            return (
                              <button
                                key={slot.id}
                                disabled={disabled}
                                onClick={() => {
                                  setSelectedSlot({...slot, waitlistOnly: isWaitlist});
                                  setStep(3);
                                }}
                                className={`px-5 py-3 rounded-full flex items-center gap-2 border transition-all ${
                                  disabled ? 'opacity-40 cursor-not-allowed border-surface-800 text-surface-500' :
                                  isSelected ? 'border-transparent text-white shadow-lg' : 'border-surface-700 text-surface-200 hover:border-surface-500 hover:text-white'
                                }`}
                                style={isSelected ? { backgroundColor: brandColor } : {}}
                              >
                                <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                                <span className="font-semibold">{slot.startTime.slice(0,5)}</span>
                                {isWaitlist && <span className="text-xs opacity-80">(Waitlist)</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-4 flex items-center justify-between border-surface-800 cursor-pointer hover:bg-white/5" onClick={() => setStep(2)}>
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{form.guestCount} Guests</span>
                      <span className="text-surface-600">•</span>
                      <span className="text-white font-medium">{selectedSlot?.startTime?.slice(0,5)} {selectedSlot?.waitlistOnly ? '(Waitlist)' : ''}</span>
                    </div>
                    <span className="text-surface-400">Selected</span>
                  </div>
                )}
              </div>
            )}

            {/* 4. DETAILS & CONFIRM */}
            {step >= 3 && (
              <div className={`transition-opacity duration-500 ${step >= 3 ? 'opacity-100 animate-slide-up' : 'hidden'}`}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-surface-800 text-surface-400 flex items-center justify-center text-sm">
                    {outlets.length > 1 ? '4' : '3'}
                  </span>
                  Your Details
                </h2>

                <form onSubmit={handleBooking} className="glass-card p-6 border-surface-800 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">Full Name *</label>
                      <input 
                        required 
                        value={form.customerName}
                        onChange={e => setForm({...form, customerName: e.target.value})}
                        className="glass-input bg-surface-900/50 border-surface-700" 
                        placeholder="John Doe" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-300 mb-2">Phone Number *</label>
                      <input 
                        required 
                        pattern="(\+91)?[6-9]\d{9}"
                        value={form.customerPhone}
                        onChange={e => setForm({...form, customerPhone: e.target.value})}
                        className="glass-input bg-surface-900/50 border-surface-700" 
                        placeholder="+91 9876543210" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-300 mb-2">Email Address <span className="text-surface-500 font-normal">(Optional, for booking receipt)</span></label>
                    <input 
                      type="email" 
                      value={form.customerEmail}
                      onChange={e => setForm({...form, customerEmail: e.target.value})}
                      className="glass-input bg-surface-900/50 border-surface-700" 
                      placeholder="john@example.com" 
                    />
                  </div>

                  <div className="pt-4 border-t border-surface-800">
                    <label className="block text-sm font-medium text-surface-300 mb-3">Are you celebrating anything?</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {['None', 'Birthday', 'Anniversary', 'Date', 'Business', 'Other'].map(occ => (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => setForm({...form, occasion: occ})}
                          className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                            form.occasion === occ ? 'text-white border-transparent' : 'border-surface-700 text-surface-300 hover:border-surface-500'
                          }`}
                          style={form.occasion === occ ? { backgroundColor: brandColor } : {}}
                        >
                          {occ}
                        </button>
                      ))}
                    </div>
                    {['Birthday', 'Anniversary'].includes(form.occasion) && (
                      <input 
                        value={form.occasionDetails}
                        onChange={e => setForm({...form, occasionDetails: e.target.value})}
                        className="glass-input bg-surface-900/50 border-surface-700 mb-4" 
                        placeholder="Who is it for? (e.g. My wife's 30th)" 
                      />
                    )}
                    
                    <label className="block text-sm font-medium text-surface-300 mb-2">Special Requests</label>
                    <textarea 
                      value={form.specialRequests}
                      onChange={e => setForm({...form, specialRequests: e.target.value})}
                      className="glass-input bg-surface-900/50 border-surface-700 resize-none h-24" 
                      placeholder="Dietary requirements, high chair needed, etc." 
                    />
                  </div>

                  {/* Summary & Confirm Area */}
                  <div className="bg-surface-900 p-5 rounded-2xl border border-surface-800">
                    <div className="flex items-start gap-3 mb-4">
                      <input 
                        type="checkbox" 
                        id="policy" 
                        required
                        checked={form.agreePolicy}
                        onChange={e => setForm({...form, agreePolicy: e.target.checked})}
                        className="mt-1 rounded bg-surface-800 border-surface-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-surface-900 cursor-pointer"
                      />
                      <label htmlFor="policy" className="text-sm text-surface-400 cursor-pointer leading-tight">
                        I agree to the <span className="text-white underline">cancellation policy</span> and understand my details are shared securely with {business.name}.
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="w-full py-4 rounded-xl font-bold text-white text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                      style={{ backgroundColor: brandColor }}
                    >
                      {submitting ? (
                        <div className="spinner border-t-white" />
                      ) : (
                        <>
                          {selectedSlot?.waitlistOnly 
                            ? 'Join Waitlist' 
                            : business.require_deposit 
                              ? `Pay ₹${business.deposit_amount} & Confirm` 
                              : 'Confirm Booking'}
                        </>
                      )}
                    </button>
                  </div>

                </form>
              </div>
            )}
            
          </div>
        )}
      </div>
      
      {/* Footer minimal branding */}
      <div className="py-6 text-center text-xs text-surface-600 border-t border-surface-900 mt-auto">
        Powered by <a href="#" className="font-semibold text-surface-400 hover:text-white">TableFlow</a>
      </div>

    </div>
  );
}
