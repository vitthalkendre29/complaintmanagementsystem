// src/components/common/Input.jsx
import React from 'react';

const Input = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  icon: Icon,
  className = '',
  ...rest
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}

      {/* Input Wrapper */}
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <div className="absolute left-0 top-0 h-full flex items-center px-3 py-2 pointer-events-none">
            <Icon className="h-5 w-5 text-gray-500" />
          </div>
        )}

        {/* Input */}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`
            w-full
            py-2
            rounded-lg
            border
            text-gray-800
            placeholder-gray-500
            transition-all
            ${Icon ? 'input-with-icon' : ''}
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          {...rest}
        />
      </div>

      {/* Error */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
