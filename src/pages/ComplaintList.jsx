// src/pages/ComplaintList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, FileText, HelpCircle } from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Input from '../components/common/Input';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';
import { COMPLAINT_STATUS, CATEGORIES, PRIORITIES } from '../utils/constants';

const ComplaintList = ({ onNavigate }) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ status: '', category: '', priority: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getAll(token);
      setComplaints(data.complaints || data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchComplaints(); }, [fetchComplaints]);

  const applyFilters = useCallback(() => {
    let filtered = [...complaints];
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filters.status) filtered = filtered.filter(c => c.status === filters.status);
    if (filters.category) filtered = filtered.filter(c => c.category === filters.category);
    if (filters.priority) filtered = filtered.filter(c => c.priority === filters.priority);
    setFilteredComplaints(filtered);
  }, [complaints, searchTerm, filters]);

  useEffect(() => { applyFilters(); }, [applyFilters]);

  const handleFilterChange = (name, value) => setFilters(f => ({ ...f, [name]: value }));
  const clearFilters = () => { setFilters({ status: '', category: '', priority: '' }); setSearchTerm(''); };

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">All Complaints</h1>
        <p className="text-gray-500 mt-1">Browse and filter complaints</p>
      </div>

      {/* Search + Filter */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input type="text" placeholder="Search complaints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} icon={Search} />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-5 w-5 mr-2" />Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Statuses</option>
                {Object.values(COMPLAINT_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={filters.category} onChange={e => handleFilterChange('category', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={filters.priority} onChange={e => handleFilterChange('priority', e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Priorities</option>
                {Object.values(PRIORITIES).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button onClick={clearFilters} className="sm:col-span-3 text-sm text-blue-600 hover:text-blue-700 font-medium text-center">Clear All Filters</button>
          </div>
        )}
      </Card>

      <p className="text-sm text-gray-600">Showing {filteredComplaints.length} of {complaints.length} complaints</p>

      {filteredComplaints.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No complaints found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map(c => (
            <Card
              key={c._id}
              hover
              className={`cursor-pointer ${c.pendingInfoRequest ? 'border-2 border-amber-300' : ''}`}
              onClick={() => onNavigate('complaint-detail', c._id)}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-gray-800">{c.title}</h3>
                  {c.pendingInfoRequest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-full">
                      <HelpCircle className="h-3 w-3" /> Info Requested
                    </span>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status={c.status} />
                  {c.status !== 'Open' && c.status !== 'Rejected' && (
                    <StatusBadge priority={c.priority} type="priority" />
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{truncateText(c.description, 150)}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex gap-2 flex-wrap">
                  <span className="px-2 py-1 bg-gray-100 rounded">{c.category}</span>
                  {c.anonymous ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Anonymous</span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{c.submittedBy?.name || 'Unknown'}</span>
                  )}
                </div>
                <span>{getRelativeTime(c.createdAt)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintList;