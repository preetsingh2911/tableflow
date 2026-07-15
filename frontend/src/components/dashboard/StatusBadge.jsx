import React from 'react';

const statusStyles = {
  pending: 'bg-dashboard-pendingBg text-dashboard-pendingText',
  confirmed: 'bg-dashboard-successBg text-dashboard-successText',
  cancelled: 'bg-dashboard-dangerBg text-dashboard-dangerText',
  seated: 'bg-blue-100 text-blue-700',
  no_show: 'bg-gray-100 text-gray-700',
  waitlist: 'bg-dashboard-warningBg text-dashboard-warningText',
  completed: 'bg-gray-100 text-gray-700',
  active: 'bg-dashboard-successBg text-dashboard-successText',
  trial: 'bg-blue-100 text-blue-800',
  suspended: 'bg-dashboard-warningBg text-dashboard-warningText',
};

const defaultStyle = 'bg-gray-100 text-gray-700';

export default function StatusBadge({ status }) {
  const normalizedStatus = status?.toLowerCase() || '';
  const style = statusStyles[normalizedStatus] || defaultStyle;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${style}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
