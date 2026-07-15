import { useState, useEffect } from 'react';
import { blockedDatesAPI, outletAPI } from '../../api';
import toast from 'react-hot-toast';
import { 
  format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  isSameMonth, isSameDay, isToday, isBefore, startOfDay
} from 'date-fns';

export default function BlockedDatesPage() {
  const [outlets, setOutlets] = useState([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkRange, setBulkRange] = useState({ start: null, end: null });
  const [blockReason, setBlockReason] = useState('');
  
  useEffect(() => {
    outletAPI.list().then(res => {
      setOutlets(res.data.data.outlets);
      if (res.data.data.outlets.length > 0) {
        setSelectedOutlet(res.data.data.outlets[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedOutlet) loadBlockedDates();
  }, [selectedOutlet, currentMonth]);

  const loadBlockedDates = async () => {
    setLoading(true);
    try {
      const nextMonth = addMonths(currentMonth, 1);
      const start = format(currentMonth, 'yyyy-MM-dd');
      const end = format(endOfMonth(nextMonth), 'yyyy-MM-dd');
      
      const { data } = await blockedDatesAPI.list({ outletId: selectedOutlet, startDate: start, endDate: end });
      setBlockedDates(data.data.blockedDates);
    } catch (err) {
      toast.error('Failed to load blocked dates.');
    } finally {
      setLoading(false);
    }
  };

  const isBlocked = (date) => {
    return blockedDates.find(b => b.date.substring(0, 10) === format(date, 'yyyy-MM-dd'));
  };

  const handleDateClick = async (date) => {
    if (isBefore(date, startOfDay(new Date()))) {
      toast.error('Cannot block past dates.');
      return;
    }

    if (bulkMode) {
      if (!bulkRange.start || (bulkRange.start && bulkRange.end)) {
        setBulkRange({ start: date, end: null });
      } else {
        const start = isBefore(bulkRange.start, date) ? bulkRange.start : date;
        const end = isBefore(bulkRange.start, date) ? date : bulkRange.start;
        setBulkRange({ start, end });
      }
      return;
    }

    const existingBlock = isBlocked(date);
    if (existingBlock) {
      if (confirm('Unblock this date?')) {
        try {
          await blockedDatesAPI.delete(existingBlock.id);
          toast.success('Date unblocked');
          loadBlockedDates();
        } catch (err) {
          toast.error('Failed to unblock date');
        }
      }
    } else {
      const reason = prompt('Optional reason for blocking this date (e.g. Holiday):');
      if (reason !== null) {
        try {
          await blockedDatesAPI.create({ outletId: selectedOutlet, dates: [format(date, 'yyyy-MM-dd')], reason });
          toast.success('Date blocked');
          loadBlockedDates();
        } catch (err) {
          toast.error('Failed to block date');
        }
      }
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkRange.start || !bulkRange.end) return;
    
    const dates = eachDayOfInterval({ start: bulkRange.start, end: bulkRange.end })
      .map(d => format(d, 'yyyy-MM-dd'));
      
    try {
      await blockedDatesAPI.create({ outletId: selectedOutlet, dates, reason: blockReason });
      toast.success('Dates blocked successfully');
      setBulkMode(false);
      setBulkRange({ start: null, end: null });
      setBlockReason('');
      loadBlockedDates();
    } catch (err) {
      toast.error('Failed to block dates');
    }
  };

  const isInBulkRange = (date) => {
    if (!bulkMode || !bulkRange.start) return false;
    if (!bulkRange.end) return isSameDay(date, bulkRange.start);
    return !isBefore(date, bulkRange.start) && !isBefore(bulkRange.end, date);
  };

  const renderMonth = (monthDate) => {
    const days = eachDayOfInterval({
      start: startOfMonth(monthDate),
      end: endOfMonth(monthDate)
    });
    
    // Pad start of month
    const startDay = days[0].getDay();
    const blanks = Array.from({ length: startDay }).map((_, i) => <div key={`blank-${i}`} className="p-2"></div>);

    return (
      <div className="dashboard-card p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{format(monthDate, 'MMMM yyyy')}</h3>
        <div className="grid grid-cols-7 gap-1 mb-2 text-center text-sm font-medium text-gray-500">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks}
          {days.map(date => {
            const blocked = isBlocked(date);
            const isPast = isBefore(date, startOfDay(new Date()));
            const isBulkSelected = isInBulkRange(date);
            
            let className = "aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ";
            
            if (isPast) {
              className += "text-gray-400 cursor-not-allowed opacity-50";
            } else if (isBulkSelected) {
              className += "bg-dashboard-primary text-white cursor-pointer hover:bg-dashboard-primaryDark shadow-sm";
            } else if (blocked) {
              className += "bg-red-50 text-red-700 border border-red-200 cursor-pointer hover:bg-red-100 font-bold";
            } else {
              className += "text-gray-700 cursor-pointer hover:bg-gray-100 bg-white border border-gray-100";
              if (isToday(date)) className += " ring-2 ring-dashboard-primary/50 text-dashboard-primary font-bold";
            }

            return (
              <div 
                key={date.toString()} 
                onClick={() => handleDateClick(date)}
                className={className}
                title={blocked ? blocked.reason || 'Blocked' : ''}
              >
                {format(date, 'd')}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blocked Dates</h1>
          <p className="text-gray-500 mt-1">Manage closures and holidays</p>
        </div>
        
        <div className="flex items-center gap-4">
          {outlets.length > 1 && (
            <select
              value={selectedOutlet}
              onChange={e => setSelectedOutlet(e.target.value)}
              className="dashboard-input !w-auto py-2"
            >
              {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          )}
          <button 
            onClick={() => {
              setBulkMode(!bulkMode);
              setBulkRange({ start: null, end: null });
            }} 
            className={`btn-dashboard-secondary ${bulkMode ? '!border-dashboard-primary !text-dashboard-primary !bg-dashboard-primary/5 ring-2 ring-dashboard-primary/20' : ''}`}
          >
            {bulkMode ? 'Cancel Bulk Selection' : 'Bulk Block Dates'}
          </button>
        </div>
      </div>

      {bulkMode && (
        <div className="dashboard-card p-6 mb-8 border-dashboard-primary ring-1 ring-dashboard-primary flex flex-wrap items-end gap-4 bg-dashboard-primary/5 shadow-inner">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Bulk Selection Mode</h3>
            <p className="text-gray-600 text-sm mb-4">Click two dates on the calendar to select a range.</p>
            <div className="flex gap-4 items-center">
              <span className="text-gray-900 font-medium bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm">
                Start: {bulkRange.start ? format(bulkRange.start, 'MMM d, yyyy') : 'Select...'}
              </span>
              <span className="text-gray-500 font-bold">→</span>
              <span className="text-gray-900 font-medium bg-white border border-gray-300 px-4 py-2 rounded-lg shadow-sm">
                End: {bulkRange.end ? format(bulkRange.end, 'MMM d, yyyy') : 'Select...'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
            <input 
              type="text" 
              value={blockReason} 
              onChange={e => setBlockReason(e.target.value)}
              className="dashboard-input" 
              placeholder="e.g. Diwali Closure"
            />
          </div>
          <button 
            onClick={handleBulkSubmit} 
            disabled={!bulkRange.start || !bulkRange.end}
            className="btn-dashboard-primary"
          >
            Block Selected Dates
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, -1))} className="btn-dashboard-secondary px-4">← Previous</button>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-dashboard-secondary px-4">Next →</button>
      </div>

      {loading && !blockedDates.length ? (
        <div className="flex justify-center py-20"><div className="spinner border-dashboard-primary border-t-transparent" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderMonth(currentMonth)}
          {renderMonth(addMonths(currentMonth, 1))}
        </div>
      )}
      
      <div className="mt-8 flex items-center gap-6 text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-red-50 border border-red-200"></div>
          <span className="font-medium text-gray-700">Blocked Date</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded border-2 border-dashboard-primary/50 text-center flex items-center justify-center text-[10px] text-dashboard-primary font-bold">T</div>
          <span className="font-medium text-gray-700">Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded text-gray-400 text-center flex items-center justify-center font-bold">X</div>
          <span className="font-medium text-gray-700">Past / Unavailable</span>
        </div>
      </div>
    </div>
  );
}
