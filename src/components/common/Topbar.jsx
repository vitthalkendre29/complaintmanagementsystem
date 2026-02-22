// src/components/common/Topbar.jsx
import React from 'react';
import { Menu, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/helpers';

/**
 * Top Navigation Bar Component
 */
const Topbar = ({ title, onMenuClick }) => {
  const { user } = useAuth();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      {/* Left Section */}
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="lg:hidden mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <Bell className="h-6 w-6 text-gray-600" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Profile */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {getInitials(user?.name)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;