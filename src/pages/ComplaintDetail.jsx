// src/pages/ComplaintDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, UserCheck, MessageSquare, Send, ChevronDown, ChevronUp } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { PRIORITIES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/helpers';
import { ROLES, COMPLAINT_STATUS } from '../utils/constants';

// ─── Small helper components ──────────────────────────────────────────────────

const Avatar = ({ name, size = 'sm' }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, count }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className="h-5 w-5 text-blue-600" />
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {count !== undefined && (
      <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
        {count}
      </span>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const ComplaintDetail = ({ complaintId, onBack }) => {
  const { token, hasRole } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Modal/panel visibility
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAssignHistory, setShowAssignHistory] = useState(true);

  // Form states
  const [statusData, setStatusData] = useState({ status: '', comment: '' });
  const [currentPriority, setCurrentPriority] = useState('');
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Assign modal state
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [assignData, setAssignData] = useState({ assignedTo: '', department: '', note: '' });

  const isAdmin = hasRole(ROLES.ADMIN) || hasRole(ROLES.SUPERADMIN);

  // ── Fetch complaint ────────────────────────────────────────────────────────
  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getById(token, complaintId);
      setComplaint(data.complaint || data);
    } catch (error) {
      console.error('Error fetching complaint:', error);
    } finally {
      setLoading(false);
    }
  }, [token, complaintId]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  useEffect(() => {
    if (complaint) setCurrentPriority(complaint.priority);
  }, [complaint]);

  // ── Fetch admins when assign modal opens ──────────────────────────────────
  const openAssignModal = async () => {
    setShowAssignModal(true);
    if (admins.length > 0) return;
    try {
      setAdminsLoading(true);
      const data = await complaintsAPI.getAdmins(token);
      setAdmins(data.admins || []);
    } catch (err) {
      console.error('Failed to load admins:', err);
    } finally {
      setAdminsLoading(false);
    }
  };

  // Pre-fill department when admin is selected
  const handleAdminSelect = (adminId) => {
    const selected = admins.find(a => a._id === adminId);
    setAssignData(prev => ({
      ...prev,
      assignedTo: adminId,
      department: selected?.department || prev.department,
    }));
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.updateStatus(token, complaintId, {
        ...statusData,
        priority: currentPriority,
      });
      setShowStatusUpdate(false);
      setStatusData({ status: '', comment: '' });
      fetchComplaint();
    } catch (error) {
      alert('Failed to update status: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!assignData.assignedTo) return;
    try {
      setUpdating(true);
      await complaintsAPI.assign(token, complaintId, assignData);
      setShowAssignModal(false);
      setAssignData({ assignedTo: '', department: '', note: '' });
      fetchComplaint();
    } catch (error) {
      alert('Failed to assign complaint: ' + error.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      setSendingReply(true);
      await complaintsAPI.addReply(token, complaintId, replyMessage.trim());
      setReplyMessage('');
      fetchComplaint();
    } catch (error) {
      alert('Failed to send reply: ' + error.message);
    } finally {
      setSendingReply(false);
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

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner fullScreen />;

  if (!complaint) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">Complaint not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const assignmentHistory = complaint.assignmentHistory || [];
  const adminReplies = complaint.adminReplies || [];

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to List
      </button>

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{complaint.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={complaint.status} />
              {complaint.status !== 'Open' && (
                <StatusBadge priority={complaint.priority} type="priority" />
              )}
            </div>
          </div>

          {/* Admin action buttons */}
          {isAdmin && (
            <div className="flex gap-2 flex-wrap">
              {!isResolved && (
                <>
                  <Button variant="outline" icon={UserCheck} onClick={openAssignModal}>
                    {complaint.assignedTo ? 'Re-assign' : 'Assign'}
                  </Button>
                  <Button variant="primary" onClick={() => setShowStatusUpdate(true)}>
                    Update Status
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Currently assigned banner */}
        {complaint.assignedTo && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <UserCheck className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <div>
              <span className="text-sm font-medium text-blue-800">Currently assigned to: </span>
              <span className="text-sm font-bold text-blue-900">{complaint.assignedTo.name}</span>
              {complaint.assignedTo.department && (
                <span className="text-sm text-blue-700"> · {complaint.assignedTo.department}</span>
              )}
            </div>
          </div>
        )}

        {/* Details grid */}
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

        {/* Attachments */}
        {complaint.attachments && complaint.attachments.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Attachments</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {complaint.attachments.map((file, index) => {
                const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
                const fileUrl = `${baseURL}/${file.path}`;
                const isImage = file.mimetype.startsWith('image/');
                return (
                  <div key={index} className="border rounded-lg p-2">
                    {isImage ? (
                      <img
                        src={fileUrl}
                        alt={file.originalName}
                        className="w-full max-h-64 object-contain rounded-lg border bg-gray-50"
                      />
                    ) : (
                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-words">
                        {file.originalName}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── Assignment History ────────────────────────────────────────────── */}
      {assignmentHistory.length > 0 && (
        <Card>
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowAssignHistory(v => !v)}
          >
            <SectionHeader icon={UserCheck} title="Assignment Trail" count={assignmentHistory.length} />
            {showAssignHistory ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>

          {showAssignHistory && (
            <div className="mt-2 space-y-0">
              {/* Timeline */}
              {assignmentHistory.map((entry, index) => (
                <div key={index} className="flex gap-4">
                  {/* Line + dot */}
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-100 mt-1 flex-shrink-0" />
                    {index < assignmentHistory.length - 1 && (
                      <div className="w-0.5 bg-blue-100 flex-1 my-1" />
                    )}
                  </div>

                  <div className="pb-5 flex-1">
                    <div className="flex items-start gap-3">
                      <Avatar name={entry.assignedTo?.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-gray-800">{entry.assignedTo?.name || 'Unknown'}</span>
                          {entry.assignedTo?.department && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                              {entry.assignedTo.department}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Assigned by <span className="font-medium text-gray-600">{entry.assignedBy?.name || 'Admin'}</span>
                          {' · '}{formatDate(entry.timestamp)}
                        </p>
                        {entry.note && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="font-medium text-gray-500 text-xs uppercase tracking-wide">Note: </span>
                            {entry.note}
                          </div>
                        )}
                      </div>
                      {/* Badge for latest */}
                      {index === assignmentHistory.length - 1 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Admin Replies (visible to everyone) ──────────────────────────── */}
      {(adminReplies.length > 0 || isAdmin) && (
        <Card>
          <SectionHeader
            icon={MessageSquare}
            title={isAdmin ? 'Admin Replies' : 'Updates from Administration'}
            count={adminReplies.length}
          />

          {adminReplies.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No replies yet.</p>
          ) : (
            <div className="space-y-4 mb-4">
              {adminReplies.map((reply, index) => (
                <div key={index} className="flex gap-3">
                  <Avatar name={reply.admin?.name} />
                  <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl rounded-tl-none px-4 py-3">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{reply.admin?.name || 'Admin'}</span>
                      {reply.admin?.department && (
                        <span className="text-xs text-gray-500">· {reply.admin.department}</span>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(reply.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin reply input */}
          {isAdmin && (
            <form onSubmit={handleSendReply} className="flex gap-3 mt-2 pt-4 border-t border-gray-100">
              <div className="flex-1">
                <textarea
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  placeholder="Write a reply visible to the student..."
                  rows={2}
                  className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={sendingReply || !replyMessage.trim()}
                className="self-end px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {sendingReply ? 'Sending…' : 'Send'}
              </button>
            </form>
          )}
        </Card>
      )}

      {/* ── Status History ────────────────────────────────────────────────── */}
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
                  {history.updatedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Updated by {history.updatedBy.name || 'Admin'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Feedback ──────────────────────────────────────────────────────── */}
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
                <span key={i} className={i < complaint.feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
              ))}
            </div>
            <span className="text-sm text-gray-600">({complaint.feedback.rating}/5)</span>
          </div>
          <p className="text-gray-700">{complaint.feedback.comment}</p>
        </Card>
      )}

      {/* ═══════════════════ MODALS ═══════════════════════════════════════════ */}

      {/* ── Assign Modal ──────────────────────────────────────────────────── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <UserCheck className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">
                {complaint.assignedTo ? 'Re-assign Complaint' : 'Assign Complaint'}
              </h2>
            </div>

            {adminsLoading ? (
              <div className="flex justify-center py-8"><LoadingSpinner /></div>
            ) : (
              <form onSubmit={handleAssign} className="space-y-4">
                {/* Admin picker cards */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Admin *</label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {admins.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No admins found.</p>
                    ) : admins.map(admin => (
                      <label
                        key={admin._id}
                        className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          assignData.assignedTo === admin._id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="assignedTo"
                          value={admin._id}
                          checked={assignData.assignedTo === admin._id}
                          onChange={() => handleAdminSelect(admin._id)}
                          className="sr-only"
                        />
                        <Avatar name={admin.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                          {admin.department && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-1 inline-block">
                              {admin.department}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{admin.role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Department override */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-gray-400 font-normal">(auto-filled from admin)</span>
                  </label>
                  <input
                    type="text"
                    value={assignData.department}
                    onChange={e => setAssignData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g. IT Support, Administration…"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note for Admin</label>
                  <textarea
                    value={assignData.note}
                    onChange={e => setAssignData(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="Optional instructions or context…"
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)} disabled={updating}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" loading={updating} disabled={!assignData.assignedTo}>
                    {complaint.assignedTo ? 'Re-assign' : 'Assign'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* ── Status Update Modal ───────────────────────────────────────────── */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Status</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select
                  value={statusData.status}
                  onChange={e => setStatusData({ ...statusData, status: e.target.value })}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 mt-2 mb-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  {Object.values(COMPLAINT_STATUS).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <select
                  value={currentPriority}
                  onChange={e => setCurrentPriority(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 mb-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(PRIORITIES).map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={statusData.comment}
                  onChange={e => setStatusData({ ...statusData, comment: e.target.value })}
                  placeholder="Add a comment about this status update..."
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 mt-2 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowStatusUpdate(false)} disabled={updating}>
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

      {/* ── Feedback Modal ────────────────────────────────────────────────── */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Provide Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFeedbackData({ ...feedbackData, rating })}
                      className="text-3xl focus:outline-none"
                    >
                      <span className={rating <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea
                  value={feedbackData.comment}
                  onChange={e => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowFeedback(false)} disabled={updating}>
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