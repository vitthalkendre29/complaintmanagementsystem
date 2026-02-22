// src/components/common/Sidebar.jsx
import React from 'react';
import { Home, FileText, Users, Settings, LogOut, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../utils/constants';

const Sidebar = ({ activePage, onNavigate, isMobileOpen, onCloseMobile }) => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'complaints', label: 'Complaints', icon: FileText },
    ...(hasRole(ROLES.SUPERADMIN) ? [{ id: 'users', label: 'Manage Users', icon: Users }] : []),
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    onNavigate('login');
  };

  return (
    <>
      {/* Mobile Sidebar */}
      <div
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50
          transform transition-transform duration-300 ease-in-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:hidden
        `}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800">CMS Portal</h1>
            <p className="text-sm text-gray-500 mt-1">{user?.role || 'User'}</p>
          </div>
          <button
            className="p-1 rounded hover:bg-gray-100"
            onClick={onCloseMobile}
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onCloseMobile(); // close on mobile after click
                }}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg text-left
                  transition-colors duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:top-0 lg:left-0 lg:h-full lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:z-50">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">CMS Portal</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.role || 'User'}</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  w-full flex items-center px-4 py-3 rounded-lg text-left
                  transition-colors duration-200
                  ${isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
  