import React from 'react';

export default function DataTable({ columns, data, loading, emptyMessage, emptyCta }) {
  if (loading) {
    return (
      <div className="dashboard-card overflow-hidden">
        <div className="animate-pulse flex flex-col space-y-4 p-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-200 rounded w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="dashboard-card p-12 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-2xl text-gray-400 mb-4">
          📭
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
        <p className="text-gray-500 mb-6">{emptyMessage || "There is nothing to display here yet."}</p>
        {emptyCta && (
          <div>{emptyCta}</div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-card overflow-x-auto">
      <table className="w-full text-left text-sm text-gray-500">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 uppercase text-xs tracking-wider">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-6 py-4 font-semibold">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="dashboard-table-row">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-gray-900">
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
