// src/pages/Profile.jsx
import React, { useState } from 'react';
import { User, Mail, Briefcase, Calendar, Edit2, Save, X } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { getInitials, formatDate } from '../utils/helpers';

/**
 * User Profile Page
 */
const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    department: user?.department || '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    // TODO: Implement API call to update profile
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
      alert('Profile updated successfully!');
    }, 1000);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      department: user?.department || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6 pb-6 border-b border-gray-200">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
            {getInitials(user?.name)}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800">{user?.name}</h2>
            <p className="text-gray-500 mb-2">{user?.email}</p>
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {user?.role?.toUpperCase()}
            </div>
          </div>

          {/* Edit Button */}
          {!isEditing && (
            <Button
              variant="outline"
              icon={Edit2}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>

        {/* Profile Details */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-800">Account Information</h3>

          {isEditing ? (
            // Edit Mode
            <div className="space-y-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                icon={User}
              />

              <Input
                label="Email Address"
                type="email"
                value={user?.email}
                disabled
                icon={Mail}
              />

              <Input
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleChange}
                icon={Briefcase}
              />

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="secondary"
                  icon={X}
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  icon={Save}
                  onClick={handleSave}
                  loading={loading}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Full Name
                </label>
                <p className="text-lg text-gray-800">{user?.name}</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address
                </label>
                <p className="text-lg text-gray-800">{user?.email}</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Department
                </label>
                <p className="text-lg text-gray-800">{user?.department || 'Not specified'}</p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Role
                </label>
                <p className="text-lg text-gray-800 capitalize">{user?.role}</p>
              </div>

              {user?.studentId && (
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-600 mb-2">
                    <User className="h-4 w-4 mr-2" />
                    Student ID
                  </label>
                  <p className="text-lg text-gray-800">{user.studentId}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Account Statistics */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Statistics</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Total Complaints</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Resolved</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-600">0</p>
            <p className="text-sm text-gray-600 mt-1">Pending</p>
          </div>
        </div>
      </Card>

      {/* Security Settings */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Security</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <div>
              <p className="font-medium text-gray-800">Password</p>
              <p className="text-sm text-gray-500">Last changed 30 days ago</p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-800">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Button variant="outline" size="sm">
              Enable
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Profile;