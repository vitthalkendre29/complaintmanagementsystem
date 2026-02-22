// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';

/**
 * Admin Dashboard Page
 */
const AdminDashboard = ({ onNavigate }) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    critical: 0,
    escalated: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getAll(token);
      const complaintsList = data.complaints || data || [];
      setComplaints(complaintsList);

      // Calculate stats
      setStats({
        total: complaintsList.length,
        open: complaintsList.filter(c => c.status === 'Open').length,
        inProgress: complaintsList.filter(c => c.status === 'In Progress').length,
        resolved: complaintsList.filter(c => c.status === 'Resolved').length,
        critical: complaintsList.filter(c => c.priority === 'Critical').length,
        escalated: complaintsList.filter(c => c.status === 'Escalated').length,
      });
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  // Get pending complaints (Open + In Progress)
  const pendingComplaints = complaints.filter(
    c => c.status === 'Open' || c.status === 'In Progress'
  ).sort((a, b) => {
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage and resolve complaints efficiently</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Complaints"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Pending (Open + In Progress)"
          value={stats.open + stats.inProgress}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Critical Priority"
          value={stats.critical}
          icon={AlertCircle}
          color="red"
        />
        <StatsCard
          title="Escalated"
          value={stats.escalated}
          icon={TrendingUp}
          color="purple"
        />
        <StatsCard
          title="Resolution Rate"
          value={`${stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%`}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Pending Complaints */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Pending Complaints ({pendingComplaints.length})
          </h2>
          <button
            onClick={() => onNavigate('complaints')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>

        {pendingComplaints.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500">All complaints are resolved!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingComplaints.slice(0, 5).map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => onNavigate('complaint-detail', complaint._id)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{complaint.title}</h3>
                  <div className="flex gap-2">
                    <StatusBadge status={complaint.status} />
                    <StatusBadge priority={complaint.priority} type="priority" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {truncateText(complaint.description, 120)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-100 rounded">{complaint.category}</span>
                    {complaint.anonymous ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Anonymous</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {complaint.submittedBy?.name || 'Unknown'}
                      </span>
                    )}
                  </div>
                  <span>{getRelativeTime(complaint.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminDashboard;