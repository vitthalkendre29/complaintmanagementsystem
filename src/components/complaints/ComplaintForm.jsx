// src/components/complaints/ComplaintForm.jsx
import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';
import { complaintsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { CATEGORIES, PRIORITIES } from '../../utils/constants';

/**
 * Complaint Submission Form Component
 */
const ComplaintForm = ({ onClose, onSuccess }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    anonymous: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    try {
      await complaintsAPI.create(token, formData);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">File New Complaint</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Input
            label="Complaint Title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Brief summary of your complaint"
            required
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide detailed information about your complaint..."
              required
              rows={5}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.values(PRIORITIES).map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="anonymous"
              name="anonymous"
              checked={formData.anonymous}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
              Submit as anonymous complaint
            </label>
          </div>

          {formData.anonymous && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Anonymous complaints will not show your identity to admins. 
                However, you can still track the status in your dashboard.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintForm;