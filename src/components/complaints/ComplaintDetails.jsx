// src/components/complaints/ComplaintDetails.jsx
import React from 'react';
import { Calendar, User, AlertCircle, Clock, MapPin, Hash } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatDate } from '../../utils/helpers';

/**
 * Complaint Details Component - Reusable detailed view
 */
const ComplaintDetails = ({ complaint }) => {
  if (!complaint) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">No complaint data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <h2 className="text-2xl font-bold text-gray-800">{complaint.title}</h2>
          <div className="flex gap-2 flex-shrink-0">
            <StatusBadge status={complaint.status} />
            <StatusBadge priority={complaint.priority} type="priority" />
          </div>
        </div>

        {/* Complaint ID */}
        <div className="flex items-center text-sm text-gray-500">
          <Hash className="h-4 w-4 mr-1" />
          <span>ID: {complaint._id?.substring(0, 8) || 'N/A'}</span>
        </div>
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Category */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Category</p>
            <p className="text-base font-semibold text-gray-800 mt-1">
              {complaint.category}
            </p>
          </div>
        </div>

        {/* Submitted By */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <User className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Submitted By</p>
            <p className="text-base font-semibold text-gray-800 mt-1">
              {complaint.anonymous ? (
                <span className="text-purple-600">Anonymous User</span>
              ) : (
                complaint.submittedBy?.name || 'Unknown'
              )}
            </p>
            {!complaint.anonymous && complaint.submittedBy?.email && (
              <p className="text-xs text-gray-500 mt-0.5">
                {complaint.submittedBy.email}
              </p>
            )}
          </div>
        </div>

        {/* Submitted Date */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Calendar className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Submitted On</p>
            <p className="text-base font-semibold text-gray-800 mt-1">
              {formatDate(complaint.createdAt)}
            </p>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Last Updated</p>
            <p className="text-base font-semibold text-gray-800 mt-1">
              {formatDate(complaint.updatedAt)}
            </p>
          </div>
        </div>

        {/* Assigned To (if applicable) */}
        {complaint.assignedTo && (
          <div className="flex items-start gap-3 sm:col-span-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <User className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned To</p>
              <p className="text-base font-semibold text-gray-800 mt-1">
                {complaint.assignedTo.name}
              </p>
              {complaint.assignedTo.department && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {complaint.assignedTo.department}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {complaint.description}
          </p>
        </div>
      </div>

      {/* Attachments (if any) */}
      {complaint.attachments && complaint.attachments.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Attachments</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {complaint.attachments.map((attachment, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <p className="text-sm font-medium text-gray-800 truncate">
                  {attachment.name || `Attachment ${index + 1}`}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {attachment.size || 'Unknown size'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anonymous Notice */}
      {complaint.anonymous && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-800">Anonymous Complaint</p>
              <p className="text-sm text-purple-700 mt-1">
                This complaint was submitted anonymously. User identity is protected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetails;