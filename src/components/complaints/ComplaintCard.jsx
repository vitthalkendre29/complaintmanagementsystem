// src/components/complaints/ComplaintCard.jsx
import React from 'react';
import { Calendar, User, MessageSquare } from 'lucide-react';
import Card from '../common/Card';
import StatusBadge from '../common/StatusBadge';
import { getRelativeTime, truncateText } from '../../utils/helpers';

/**
 * Complaint Card Component - Display complaint in card format
 */
const ComplaintCard = ({ complaint, onClick }) => {
  return (
    <Card 
      hover 
      className="cursor-pointer transition-all duration-200"
      onClick={() => onClick(complaint._id)}
    >
      {/* Header with Title and Badges */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
          {complaint.title}
        </h3>
        <div className="flex gap-2 flex-shrink-0">
          <StatusBadge status={complaint.status} />
          <StatusBadge priority={complaint.priority} type="priority" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 mb-4 leading-relaxed">
        {truncateText(complaint.description, 150)}
      </p>

      {/* Footer Info */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
        {/* Category */}
        <span className="inline-flex items-center px-3 py-1 bg-gray-100 rounded-full">
          {complaint.category}
        </span>

        {/* Submitted By */}
        <span className="inline-flex items-center">
          <User className="h-3.5 w-3.5 mr-1" />
          {complaint.anonymous ? (
            <span className="text-purple-600 font-medium">Anonymous</span>
          ) : (
            <span>{complaint.submittedBy?.name || 'Unknown'}</span>
          )}
        </span>

        {/* Date */}
        <span className="inline-flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1" />
          {getRelativeTime(complaint.createdAt)}
        </span>

        {/* Comments Count (if available) */}
        {complaint.statusHistory && complaint.statusHistory.length > 0 && (
          <span className="inline-flex items-center">
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            {complaint.statusHistory.length} updates
          </span>
        )}
      </div>
    </Card>
  );
};

export default ComplaintCard;