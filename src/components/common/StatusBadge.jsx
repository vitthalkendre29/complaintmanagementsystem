// src/components/common/StatusBadge.jsx
import React from 'react';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../utils/constants';

/**
 * Status Badge Component
 * Displays colored badges for complaint status or priority
 * 
 * @param {string} status - Complaint status (Open, In Progress, Resolved, etc.)
 * @param {string} priority - Priority level (Low, Medium, High, Critical)
 * @param {string} type - Badge type: 'status' or 'priority' (default: 'status')
 * @param {string} className - Additional CSS classes
 */
const StatusBadge = ({ 
  status, 
  priority, 
  type = 'status',
  className = '' 
}) => {
  // Determine which value and color map to use
  const colors = type === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;
  const value = type === 'priority' ? priority : status;
  
  // Get color class or use default gray
  const colorClass = colors[value] || 'bg-gray-100 text-gray-800';

  // Don't render if no value provided
  if (!value) {
    return null;
  }

  return (
    <span 
      className={`
        inline-flex items-center px-3 py-1 rounded-full 
        text-xs font-medium
        ${colorClass}
        ${className}
      `}
    >
      {value}
    </span>
  );
};

export default StatusBadge;