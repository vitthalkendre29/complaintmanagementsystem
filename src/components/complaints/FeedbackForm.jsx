// src/components/complaints/FeedbackForm.jsx
import React, { useState } from 'react';
import { Star, AlertCircle, CheckCircle } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { complaintsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

/**
 * Feedback Form Component for Resolved Complaints
 */
const FeedbackForm = ({ complaintId, isOpen, onClose, onSuccess }) => {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide feedback comment');
      return;
    }

    try {
      setLoading(true);
      await complaintsAPI.addFeedback(token, complaintId, {
        rating,
        comment: comment.trim()
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Provide Feedback"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Your Complaint Has Been Resolved!
          </h3>
          <p className="text-gray-600 text-sm">
            We'd love to hear about your experience with the resolution process.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Rating Section */}
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            How satisfied are you with the resolution? <span className="text-red-500">*</span>
          </label>
          <div className="flex justify-center gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="focus:outline-none transition-transform hover:scale-110"
              >
                <Star
                  className={`h-10 w-10 ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-gray-600">
              {rating === 1 && 'Very Dissatisfied'}
              {rating === 2 && 'Dissatisfied'}
              {rating === 3 && 'Neutral'}
              {rating === 4 && 'Satisfied'}
              {rating === 5 && 'Very Satisfied'}
            </p>
          )}
        </div>

        {/* Comment Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Share your experience <span className="text-red-500">*</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience with the resolution process..."
            rows={5}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Your feedback helps us improve our services
          </p>
        </div>

        {/* Helpful Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 mb-2 font-medium">
            💡 Helpful feedback includes:
          </p>
          <ul className="text-sm text-blue-700 space-y-1 ml-4 list-disc">
            <li>How quickly the issue was resolved</li>
            <li>Communication quality from the admin team</li>
            <li>Overall satisfaction with the outcome</li>
            <li>Any suggestions for improvement</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
          >
            Submit Feedback
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackForm;