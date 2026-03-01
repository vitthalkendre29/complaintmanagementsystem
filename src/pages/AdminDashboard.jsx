// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp, XCircle } from 'lucide-react';
import StatsCard from '../components/dashboard/StatsCard';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';

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
    rejected: 0,
  });
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
        critical: list.filter(c => c.priority === 'Critical').length,
        escalated: list.filter(c => c.status === 'Escalated').length,
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

  const pendingComplaints = complaints
    .filter(c => c.status === 'Open' || c.status === 'In Progress')
    .sort((a, b) => {
      const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return order[a.priority] - order[b.priority];
    });

  const genuine = stats.total - stats.rejected;
  const resolutionRate = genuine > 0 ? Math.round((stats.resolved / genuine) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">Manage and resolve complaints efficiently</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard title="Total Complaints" value={stats.total} icon={FileText} color="blue" />
        <StatsCard title="Pending" value={stats.open + stats.inProgress} icon={Clock} color="yellow" />
        <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle} color="green" />
        <StatsCard title="Rejected" value={stats.rejected} icon={XCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard title="Critical Priority" value={stats.critical} icon={AlertCircle} color="red" />
        <StatsCard title="Escalated" value={stats.escalated} icon={TrendingUp} color="purple" />
        <StatsCard
          title="Resolution Rate"
          value={`${resolutionRate}%`}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Rejection rate insight */}
      {stats.total > 0 && (
        <div className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">Genuine vs Rejected</span>
              <span className="text-gray-500">
                {genuine} genuine · {stats.rejected} rejected
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 flex overflow-hidden">
              <div
                className="bg-green-500 h-2.5 rounded-l-full transition-all"
                style={{ width: `${stats.total > 0 ? (genuine / stats.total) * 100 : 0}%` }}
              />
              <div
                className="bg-red-400 h-2.5 rounded-r-full transition-all"
                style={{ width: `${stats.total > 0 ? (stats.rejected / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pending Complaints */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Pending Complaints ({pendingComplaints.length})
          </h2>
          <button onClick={() => onNavigate('complaints')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
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
            {pendingComplaints.slice(0, 5).map(c => (
              <div
                key={c._id}
                onClick={() => onNavigate('complaint-detail', c._id)}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{c.title}</h3>
                  <div className="flex gap-2 flex-wrap">
                    <StatusBadge status={c.status} />
                      {c.status !== 'Open' && c.status !== 'Rejected' && (
                      <StatusBadge priority={c.priority} type="priority" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{truncateText(c.description, 120)}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-gray-100 rounded">{c.category}</span>
                    {c.anonymous ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Anonymous</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {c.submittedBy?.name || 'Unknown'}
                      </span>
                    )}
                    {/* Pending info request indicator */}
                    {c.pendingInfoRequest && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-medium">
                        ⏳ Awaiting Info
                      </span>
                    )}
                  </div>
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

export default AdminDashboard;