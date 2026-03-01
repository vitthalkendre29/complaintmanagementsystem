// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, HelpCircle,XCircle   } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';

const StudentDashboard = ({ onNavigate, onFileComplaint }) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getAll(token);
      const list = data.complaints || data || [];
      setComplaints(list);
      setStats({
        total: list.length,
        open: list.filter(c => c.status === 'Open').length,
        inProgress: list.filter(c => c.status === 'In Progress').length,
        resolved: list.filter(c => c.status === 'Resolved').length,
        rejected: list.filter(c => c.status === 'Rejected').length,
      });
    } catch (err) {
      console.error('Error fetching complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  if (loading) return <LoadingSpinner fullScreen />;

  // Complaints needing attention — pending info request or open
  const needsAttention = complaints.filter(c => c.pendingInfoRequest);

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

      {/* Action required banner */}
      {needsAttention.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
          <HelpCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              {needsAttention.length === 1
                ? 'An admin has requested more information on one of your complaints'
                : `Admins have requested more information on ${needsAttention.length} complaints`}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">Click the complaint below to view the question and respond.</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard  title="Total Complaints" value={stats.total} icon={FileText} color="blue" />
        <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatsCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
        <StatsCard title="Open" value={stats.open} icon={Clock} color="yellow" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={AlertCircle} color="purple" />
      </div>

      {/* Recent Complaints */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Recent Complaints</h2>
          <button onClick={() => onNavigate('complaints')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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
            {complaints.slice(0, 5).map(c => (
              <div
                key={c._id}
                onClick={() => onNavigate('complaint-detail', c._id)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  c.pendingInfoRequest
                    ? 'border-amber-300 bg-amber-50 hover:bg-amber-100'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800">{c.title}</h3>
                    {c.pendingInfoRequest && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-200 text-amber-800 rounded-full">
                        <HelpCircle className="h-3 w-3" /> Info Requested
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <StatusBadge status={c.status} />
                    {c.status !== 'Open' && c.status !== 'Rejected' && (
                      <StatusBadge priority={c.priority} type="priority" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{truncateText(c.description, 120)}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">{c.category}</span>
                  <span>{getRelativeTime(c.createdAt)}</span>
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