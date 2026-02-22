// src/pages/ComplaintDetail.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, User, AlertCircle, CheckCircle } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/helpers';
import { ROLES, COMPLAINT_STATUS } from '../utils/constants';

/**
 * Complaint Detail Page
 */
const ComplaintDetail = ({ complaintId, onBack }) => {
  const { token, user, hasRole } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [statusData, setStatusData] = useState({
    status: '',
    comment: '',
  });
  const [feedbackData, setFeedbackData] = useState({
    rating: 5,
    comment: '',
  });

  const isAdmin = hasRole(ROLES.ADMIN) || hasRole(ROLES.SUPERADMIN);

  useEffect(() => {
    fetchComplaint();
  }, [complaintId]);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getById(token, complaintId);
      setComplaint(data.complaint || data);
    } catch (error) {
      console.error('Error fetching complaint:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.updateStatus(token, complaintId, statusData);
      setShowStatusUpdate(false);
      setStatusData({ status: '', comment: '' });
      fetchComplaint();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.addFeedback(token, complaintId, feedbackData);
      setShowFeedback(false);
      fetchComplaint();
    } catch (error) {
      alert('Failed to submit feedback: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">Complaint not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to List
      </button>

      {/* Complaint Header */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{complaint.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={complaint.status} />
              <StatusBadge priority={complaint.priority} type="priority" />
            </div>
          </div>
          {isAdmin && complaint.status !== 'Resolved' && complaint.status !== 'Closed' && (
            <Button
              variant="primary"
              onClick={() => setShowStatusUpdate(true)}
            >
              Update Status
            </Button>
          )}
        </div>

        {/* Complaint Details */}
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Category</p>
              <p className="font-medium text-gray-800">{complaint.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Submitted By</p>
              <p className="font-medium text-gray-800">
                {complaint.anonymous ? 'Anonymous' : complaint.submittedBy?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Submitted On</p>
              <p className="font-medium text-gray-800">{formatDate(complaint.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Last Updated</p>
              <p className="font-medium text-gray-800">{formatDate(complaint.updatedAt)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-2">Description</p>
            <p className="text-gray-700 whitespace-pre-wrap">{complaint.description}</p>
          </div>
        </div>
      </Card>

      {/* Status History */}
      {complaint.statusHistory && complaint.statusHistory.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Status History</h2>
          <div className="space-y-4">
            {complaint.statusHistory.map((history, index) => (
              <div key={index} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={history.status} />
                    <span className="text-sm text-gray-500">{formatDate(history.timestamp)}</span>
                  </div>
                  {history.comment && (
                    <p className="text-sm text-gray-700 mt-2">{history.comment}</p>
                  )}
                  {history.changedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated by {history.changedBy.name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Feedback Section */}
      {complaint.status === 'Resolved' && !complaint.feedback && !showFeedback && !isAdmin && (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Complaint Resolved</h3>
            <p className="text-gray-600 mb-4">How was your experience with the resolution?</p>
            <Button variant="primary" onClick={() => setShowFeedback(true)}>
              Provide Feedback
            </Button>
          </div>
        </Card>
      )}

      {complaint.feedback && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Feedback</h2>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < complaint.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({complaint.feedback.rating}/5)
            </span>
          </div>
          <p className="text-gray-700">{complaint.feedback.comment}</p>
        </Card>
      )}

      {/* Status Update Modal */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Status</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Status
                </label>
                <select
                  value={statusData.status}
                  onChange={(e) => setStatusData({ ...statusData, status: e.target.value })}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  {Object.values(COMPLAINT_STATUS).map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={statusData.comment}
                  onChange={(e) => setStatusData({ ...statusData, comment: e.target.value })}
                  placeholder="Add a comment about this status update..."
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowStatusUpdate(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={updating}>
                  Update Status
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Provide Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackData({ ...feedbackData, rating })}
                      className="text-3xl focus:outline-none"
                    >
                      <span className={rating <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comment
                </label>
                <textarea
                  value={feedbackData.comment}
                  onChange={(e) => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowFeedback(false)}
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" loading={updating}>
                  Submit Feedback
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetail;