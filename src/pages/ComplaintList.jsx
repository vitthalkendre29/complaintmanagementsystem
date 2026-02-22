// src/pages/ComplaintList.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Input from '../components/common/Input';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';
import { COMPLAINT_STATUS, CATEGORIES, PRIORITIES } from '../utils/constants';

/**
 * Complaint List Page with Filters
 */
const ComplaintList = ({ onNavigate }) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [complaints, searchTerm, filters]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getAll(token);
      const complaintsList = data.complaints || data || [];
      setComplaints(complaintsList);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...complaints];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(c => c.category === filters.category);
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(c => c.priority === filters.priority);
    }

    setFilteredComplaints(filtered);
  };

  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      priority: '',
    });
    setSearchTerm('');
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">All Complaints</h1>
        <p className="text-gray-500 mt-1">Browse and filter complaints</p>
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={Search}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                {Object.values(COMPLAINT_STATUS).map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Priorities</option>
                {Object.values(PRIORITIES).map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="sm:col-span-3 text-sm text-blue-600 hover:text-blue-700 font-medium text-center"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <p className="text-sm text-gray-600">
        Showing {filteredComplaints.length} of {complaints.length} complaints
      </p>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No complaints found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((complaint) => (
            <Card
              key={complaint._id}
              hover
              className="cursor-pointer"
              onClick={() => onNavigate('complaint-detail', complaint._id)}
            >
              <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{complaint.title}</h3>
                <div className="flex gap-2 flex-wrap">
                  <StatusBadge status={complaint.status} />
                  <StatusBadge priority={complaint.priority} type="priority" />
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                {truncateText(complaint.description, 150)}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex gap-2 flex-wrap">
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
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintList;