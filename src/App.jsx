// src/App.jsx - Complete Updated Version
import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/common/Sidebar';
import Topbar from './components/common/Topbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ComplaintList from './pages/ComplaintList';
import ComplaintDetail from './pages/ComplaintDetail';
import Profile from './pages/Profile';
import ComplaintForm from './components/complaints/ComplaintForm';
import { ROLES } from './utils/constants';

/**
 * Main Application Router Component
 */
const AppRouter = () => {
  const { user, loading, hasRole } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const navigate = (page, data = null) => {
    setCurrentPage(page);
    if (page === 'complaint-detail') {
      setSelectedComplaintId(data);
    }
    setIsMobileSidebarOpen(false);
  };

  const handleFileComplaint = () => {
    setShowComplaintForm(true);
  };

  const handleComplaintSuccess = () => {
    setShowComplaintForm(false);
    // Refresh dashboard
    navigate('dashboard');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Authentication pages
  if (!user) {
    if (currentPage === 'register') {
      return <Register onNavigate={navigate} />;
    }
    return <Login onNavigate={navigate} />;
  }

  // Get page title based on current page
  const getPageTitle = () => {
    const titles = {
      dashboard: 'Dashboard',
      complaints: 'All Complaints',
      'complaint-detail': 'Complaint Details',
      profile: 'Profile Settings',
      users: 'User Management',
    };
    return titles[currentPage] || 'Dashboard';
  };

  // Render page content based on current page and user role
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        // Render dashboard based on user role
        if (hasRole(ROLES.SUPERADMIN)) {
          return <SuperAdminDashboard onNavigate={navigate} />;
        } else if (hasRole(ROLES.ADMIN)) {
          return <AdminDashboard onNavigate={navigate} />;
        } else {
          return (
            <StudentDashboard
              onNavigate={navigate}
              onFileComplaint={handleFileComplaint}
            />
          );
        }

      case 'complaints':
        return <ComplaintList onNavigate={navigate} />;

      case 'complaint-detail':
        return (
          <ComplaintDetail
            complaintId={selectedComplaintId}
            onBack={() => navigate('complaints')}
          />
        );

      case 'profile':
        return <Profile />;

      case 'users':
        // Only accessible to super admins
        if (!hasRole(ROLES.SUPERADMIN)) {
          return (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                Access denied. Super admin privileges required.
              </p>
            </div>
          );
        }
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              User Management
            </h2>
            <p className="text-gray-600 mb-6">
              Manage system users, roles, and permissions.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Coming Soon:</strong> User management features including user creation, 
                role assignment, and activity monitoring.
              </p>
            </div>
          </div>
        );

      default:
        // Default to appropriate dashboard
        if (hasRole(ROLES.SUPERADMIN)) {
          return <SuperAdminDashboard onNavigate={navigate} />;
        } else if (hasRole(ROLES.ADMIN)) {
          return <AdminDashboard onNavigate={navigate} />;
        } else {
          return (
            <StudentDashboard
              onNavigate={navigate}
              onFileComplaint={handleFileComplaint}
            />
          );
        }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={currentPage}
        onNavigate={navigate}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
        {/* Top Navigation Bar */}
        <Topbar
          title={getPageTitle()}
          onMenuClick={() => setIsMobileSidebarOpen(true)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {renderPage()}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-gray-600">
            <p>© 2025 Institute Complaint Management System. All rights reserved.</p>
            <div className="flex gap-4">
              <button className="hover:text-gray-800 transition-colors">Privacy Policy</button>
              <button className="hover:text-gray-800 transition-colors">Terms of Service</button>
              <button className="hover:text-gray-800 transition-colors">Help</button>
            </div>
          </div>
        </footer>
      </div>

      {/* Complaint Form Modal */}
      {showComplaintForm && (
        <ComplaintForm
          onClose={() => setShowComplaintForm(false)}
          onSuccess={handleComplaintSuccess}
        />
      )}
    </div>
  );
};

/**
 * Main App Component with Context Provider
 */
function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;