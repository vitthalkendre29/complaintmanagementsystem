// src/components/common/Card.jsx
import React from 'react';

/**
 * Reusable Card Component
 * A flexible container component with optional padding, hover effects, and custom styling
 * 
 * @param {ReactNode} children - Content to display inside the card
 * @param {string} className - Additional CSS classes to apply
 * @param {boolean} padding - Whether to apply default padding (default: true)
 * @param {boolean} hover - Whether to apply hover shadow effect (default: false)
 * @param {function} onClick - Optional click handler
 */
const Card = ({ 
  children, 
  className = '', 
  padding = true, 
  hover = false,
  onClick 
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const paddingClass = padding ? 'p-6' : '';
  const hoverClass = hover ? 'hover:shadow-md transition-shadow duration-200 cursor-pointer' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <div 
      className={`${baseClasses} ${paddingClass} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;