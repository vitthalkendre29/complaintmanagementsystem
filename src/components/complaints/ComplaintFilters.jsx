// src/components/complaints/ComplaintFilters.jsx
import React from 'react';
import { Filter, X } from 'lucide-react';
import Button from '../common/Button';
import { COMPLAINT_STATUS, CATEGORIES, PRIORITIES } from '../../utils/constants';

/**
 * Complaint Filters Component
 * Advanced filtering interface for complaints list
 * Supports status, category, priority, and sorting filters
 * 
 * @param {object} filters - Current filter values
 * @param {function} onFilterChange - Callback when filters change
 * @param {function} onClearFilters - Callback to clear all filters
 * @param {boolean} showFilters - Whether to show filter options
 * @param {function} onToggleFilters - Callback to toggle filter visibility
 */
const ComplaintFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  showFilters,
  onToggleFilters 
}) => {
  /**
   * Handle individual filter changes
   */
  const handleChange = (name, value) => {
    onFilterChange({ ...filters, [name]: value });
  };

  /**
   * Remove a specific filter
   */
  const removeFilter = (name) => {
    onFilterChange({ ...filters, [name]: '' });
  };

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'newest');

  /**
   * Count active filters (excluding sortBy)
   */
  const activeFilterCount = Object.entries(filters)
    .filter(([key, value]) => key !== 'sortBy' && value !== '')
    .length;

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="outline"
          icon={Filter}
          onClick={onToggleFilters}
          className="flex-shrink-0"
        >
          Filters 
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
        
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center transition-colors"
          >
            <X className="h-4 w-4 mr-1" />
            Clear All Filters
          </button>
        )}
      </div>

      {/* Filter Options Panel */}
      {showFilters && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200 animate-fadeIn">
          {/* Filter Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleChange('status', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="">All Statuses</option>
                {Object.values(COMPLAINT_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleChange('category', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="">All Categories</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={filters.priority || ''}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="">All Priorities</option>
                {Object.values(PRIORITIES).map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy || 'newest'}
                onChange={(e) => handleChange('sortBy', e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority (High to Low)</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-600 flex items-center">
                Active Filters:
              </span>
              
              {filters.status && (
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                  Status: {filters.status}
                  <button
                    onClick={() => removeFilter('status')}
                    className="ml-1.5 hover:text-blue-900 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {filters.category && (
                <span className="inline-flex items-center px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                  Category: {filters.category}
                  <button
                    onClick={() => removeFilter('category')}
                    className="ml-1.5 hover:text-green-900 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {filters.priority && (
                <span className="inline-flex items-center px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium">
                  Priority: {filters.priority}
                  <button
                    onClick={() => removeFilter('priority')}
                    className="ml-1.5 hover:text-purple-900 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Filter Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> You can combine multiple filters to narrow down your search. 
              Click on any active filter tag above to remove it individually.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintFilters;