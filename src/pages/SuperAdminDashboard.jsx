// src/pages/SuperAdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, FileText, CheckCircle, TrendingUp, AlertCircle, 
  BarChart3, Activity, Award, Clock 
} from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime } from '../utils/helpers';

/**
 * Super Admin Dashboard - Complete Overview
 */
const SuperAdminDashboard = ({ onNavigate }) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    totalComplaints: 0,
    totalUsers: 0,
    openComplaints: 0,
    resolvedComplaints: 0,
    criticalComplaints: 0,
    avgResolutionTime: 0,
    resolutionRate: 0,
    satisfactionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [categoryStats, setCategoryStats] = useState([]);

  const fetchDashboardData = useCallback( async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getAll(token);
      const complaintsList = data.complaints || data || [];
      setComplaints(complaintsList);

      // Calculate statistics
      const open = complaintsList.filter(c => c.status === 'Open').length;
      const resolved = complaintsList.filter(c => c.status === 'Resolved').length;
      const critical = complaintsList.filter(c => c.priority === 'Critical').length;

      // Calculate category statistics
      const categoryCount = {};
      complaintsList.forEach(c => {
        categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
      });
      const categoryStatsArray = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Calculate average feedback rating
      const feedbackComplaints = complaintsList.filter(c => c.feedback?.rating);
      const avgRating = feedbackComplaints.length > 0
        ? feedbackComplaints.reduce((sum, c) => sum + c.feedback.rating, 0) / feedbackComplaints.length
        : 0;

      setStats({
        totalComplaints: complaintsList.length,
        totalUsers: 150, // Mock data - should come from users API
        openComplaints: open,
        resolvedComplaints: resolved,
        criticalComplaints: critical,
        avgResolutionTime: 3.5, // Mock data - calculate from actual data
        resolutionRate: complaintsList.length > 0 ? Math.round((resolved / complaintsList.length) * 100) : 0,
        satisfactionRate: Math.round(avgRating * 20), // Convert 5-star to percentage
      });

      setCategoryStats(categoryStatsArray);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  },[token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);  

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Get recent critical complaints
  const criticalComplaints = complaints
    .filter(c => c.priority === 'Critical' && c.status !== 'Resolved')
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Complete system overview and analytics</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Complaints"
          value={stats.totalComplaints}
          icon={FileText}
          color="blue"
          trend={{ positive: true, value: '+12% this month' }}
        />
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          color="purple"
          trend={{ positive: true, value: '+8 new users' }}
        />
        <StatsCard
          title="Open Complaints"
          value={stats.openComplaints}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Critical Issues"
          value={stats.criticalComplaints}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="text-center">
          <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-gray-800">{stats.resolutionRate}%</p>
          <p className="text-sm text-gray-600 mt-1">Resolution Rate</p>
        </Card>

        <Card className="text-center">
          <Activity className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-gray-800">{stats.avgResolutionTime} days</p>
          <p className="text-sm text-gray-600 mt-1">Avg Resolution Time</p>
        </Card>

        <Card className="text-center">
          <Award className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <p className="text-3xl font-bold text-gray-800">{stats.satisfactionRate}%</p>
          <p className="text-sm text-gray-600 mt-1">User Satisfaction</p>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Complaints by Category</h2>
          {categoryStats.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No data available</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((item) => (
                <div key={item.category} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <span className="text-sm font-medium text-gray-700 min-w-[120px]">
                      {item.category}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{
                            width: `${(item.count / stats.totalComplaints) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 min-w-[40px] text-right">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Critical Complaints */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Critical Complaints</h2>
            <button
              onClick={() => onNavigate('complaints')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </button>
          </div>

          {criticalComplaints.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No critical issues!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criticalComplaints.map((complaint) => (
                <div
                  key={complaint._id}
                  onClick={() => onNavigate('complaint-detail', complaint._id)}
                  className="p-3 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm flex-1">
                      {complaint.title}
                    </h3>
                    <StatusBadge status={complaint.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="px-2 py-0.5 bg-white rounded">
                      {complaint.category}
                    </span>
                    <span>•</span>
                    <span>{getRelativeTime(complaint.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Resolved Complaints */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recently Resolved</h2>
        <div className="space-y-3">
          {complaints
            .filter(c => c.status === 'Resolved')
            .slice(0, 5)
            .map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => onNavigate('complaint-detail', complaint._id)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{complaint.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <span className="px-2 py-0.5 bg-gray-100 rounded">
                        {complaint.category}
                      </span>
                      <span>•</span>
                      <span>{getRelativeTime(complaint.updatedAt)}</span>
                      {complaint.feedback && (
                        <>
                          <span>•</span>
                          <span className="text-yellow-600">
                            ⭐ {complaint.feedback.rating}/5
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={complaint.status} />
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* System Health */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="text-center">
          <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">Excellent</p>
          <p className="text-sm text-gray-600 mt-1">System Health</p>
        </Card>

        <Card className="text-center">
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">5</p>
          <p className="text-sm text-gray-600 mt-1">Active Admins</p>
        </Card>

        <Card className="text-center">
          <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Activity className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">24/7</p>
          <p className="text-sm text-gray-600 mt-1">System Uptime</p>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;