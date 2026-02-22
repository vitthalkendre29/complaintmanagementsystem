// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';

/**
 * Student Dashboard Page
 */
const StudentDashboard = ({ onNavigate, onFileComplaint }) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);
  const fetchComplaints = useCallback( async () => {
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
      });
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  },[token]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
          <p className="text-gray-500 mt-1">Track and manage your complaints</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={onFileComplaint}>
          File New Complaint
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Complaints"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatsCard
          title="Open"
          value={stats.open}
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="In Progress"
          value={stats.inProgress}
          icon={AlertCircle}
          color="purple"
        />
        <StatsCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Recent Complaints */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Complaints</h2>
          <button
            onClick={() => onNavigate('complaints')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All
          </button>
        </div>

        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No complaints filed yet</p>
            <Button variant="primary" icon={Plus} className="mt-4" onClick={onFileComplaint}>
              File Your First Complaint
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {complaints.slice(0, 5).map((complaint) => (
              <div
                key={complaint._id}
                onClick={() => onNavigate('complaint-detail', complaint._id)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{complaint.title}</h3>
                  <div className="flex gap-2">
                    <StatusBadge status={complaint.status} />
                    {complaint.status !== "Open" && (
                      <StatusBadge 
                        priority={complaint.priority} 
                        type="priority" 
                      />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {truncateText(complaint.description, 120)}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">{complaint.category}</span>
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

export default StudentDashboard;