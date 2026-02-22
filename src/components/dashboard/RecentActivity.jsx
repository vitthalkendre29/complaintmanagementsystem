// src/components/dashboard/RecentActivity.jsx
import React from 'react';
import { Clock, CheckCircle, AlertCircle, TrendingUp, MessageSquare } from 'lucide-react';
import { getRelativeTime } from '../../utils/helpers';
import StatusBadge from '../common/StatusBadge';

/**
 * Recent Activity Component - Shows timeline of complaint updates
 */
const RecentActivity = ({ activities = [], onActivityClick }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'created':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'status_update':
        return <MessageSquare className="h-5 w-5 text-purple-600" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'escalated':
        return <TrendingUp className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActivityMessage = (activity) => {
    switch (activity.type) {
      case 'created':
        return `New complaint filed: "${activity.complaint?.title}"`;
      case 'status_update':
        return `Status updated to ${activity.newStatus}`;
      case 'resolved':
        return `Complaint resolved: "${activity.complaint?.title}"`;
      case 'escalated':
        return `Complaint escalated: "${activity.complaint?.title}"`;
      case 'feedback':
        return `Feedback received (${activity.rating} stars)`;
      default:
        return activity.message || 'Activity recorded';
    }
  };

  if (!activities || activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div
          key={activity._id || index}
          className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 p-3 rounded-lg transition-colors cursor-pointer"
          onClick={() => onActivityClick?.(activity)}
        >
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              {getActivityIcon(activity.type)}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 mb-1">
              {getActivityMessage(activity)}
            </p>
            
            {/* Details */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <span>{getRelativeTime(activity.timestamp || activity.createdAt)}</span>
              
              {activity.user && (
                <>
                  <span>•</span>
                  <span>by {activity.user.name}</span>
                </>
              )}

              {activity.complaint?.category && (
                <>
                  <span>•</span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded">
                    {activity.complaint.category}
                  </span>
                </>
              )}
            </div>

            {/* Status Badge if applicable */}
            {activity.newStatus && (
              <div className="mt-2">
                <StatusBadge status={activity.newStatus} />
              </div>
            )}

            {/* Comment if present */}
            {activity.comment && (
              <p className="text-sm text-gray-600 mt-2 italic">
                "{activity.comment}"
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentActivity;