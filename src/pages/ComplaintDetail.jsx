// src/pages/ComplaintDetail.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, AlertCircle, CheckCircle, UserCheck, MessageSquare,
  Send, ChevronDown, ChevronUp, XCircle, HelpCircle, Paperclip,
  FileText, RefreshCw, BarChart2
} from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { PRIORITIES } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/helpers';
import { ROLES, COMPLAINT_STATUS } from '../utils/constants';

// ─── Small helpers ────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 'sm' }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';
  const cls = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, count, iconColor = 'text-blue-600' }) => (
  <div className="flex items-center gap-2 mb-4">
    <Icon className={`h-5 w-5 ${iconColor}`} />
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    {count !== undefined && (
      <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
        {count}
      </span>
    )}
  </div>
);

// Submitter credibility widget (admin-only, non-anonymous)
const SubmitterStats = ({ stats, name }) => {
  if (!stats) return null;
  const pct = stats.total > 0 ? Math.round((stats.genuine / stats.total) * 100) : 100;
  const bar = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4">
      <BarChart2 className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
          Submitter history — {name}
        </p>
        <div className="flex gap-4 text-sm mb-2">
          <span><b className="text-gray-800">{stats.total}</b> <span className="text-gray-500">total</span></span>
          <span><b className="text-green-700">{stats.genuine}</b> <span className="text-gray-500">genuine</span></span>
          <span><b className="text-red-600">{stats.rejected}</b> <span className="text-gray-500">rejected</span></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div className={`${bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{pct}% genuine rate</p>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const ComplaintDetail = ({ complaintId, onBack }) => {
  const { token, hasRole } = useAuth();
  const isAdmin = hasRole(ROLES.ADMIN) || hasRole(ROLES.SUPERADMIN);

  const [complaint, setComplaint]         = useState(null);
  const [submitterStats, setSubmitterStats] = useState(null);
  const [loading, setLoading]             = useState(true);
  const [updating, setUpdating]           = useState(false);

  // ── Modal / panel toggles ────────────────────────────────────────────────
  const [showStatusUpdate,    setShowStatusUpdate]    = useState(false);
  const [showAssignModal,     setShowAssignModal]     = useState(false);
  const [showResolveModal,    setShowResolveModal]    = useState(false);
  const [showRejectModal,     setShowRejectModal]     = useState(false);
  const [showRequestInfoModal,setShowRequestInfoModal]= useState(false);
  const [showSubmitInfoPanel, setShowSubmitInfoPanel] = useState(false);
  const [showFeedback,        setShowFeedback]        = useState(false);
  const [showAssignHistory,   setShowAssignHistory]   = useState(true);

  // ── Form states ──────────────────────────────────────────────────────────
  const [statusData,      setStatusData]      = useState({ status: '', comment: '' });
  const [currentPriority, setCurrentPriority] = useState('');
  const [feedbackData,    setFeedbackData]    = useState({ rating: 5, comment: '' });
  const [replyMessage,    setReplyMessage]    = useState('');
  const [sendingReply,    setSendingReply]    = useState(false);
  const [resolveComment,  setResolveComment]  = useState('');
  const [rejectReason,    setRejectReason]    = useState('');
  const [infoQuestion,    setInfoQuestion]    = useState('');
  const [infoResponse,    setInfoResponse]    = useState('');
  const [infoFiles,       setInfoFiles]       = useState([]);
  const infoFileRef = useRef(null);

  // ── Assign state ─────────────────────────────────────────────────────────
  const [admins,        setAdmins]        = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [assignData,    setAssignData]    = useState({ assignedTo: '', department: '', note: '' });

  // ── Fetch complaint ──────────────────────────────────────────────────────
  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getById(token, complaintId);
      setComplaint(data.complaint || data);
      setSubmitterStats(data.submitterStats || null);
    } catch (err) {
      console.error('Error fetching complaint:', err);
    } finally {
      setLoading(false);
    }
  }, [token, complaintId]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);
  useEffect(() => { if (complaint) setCurrentPriority(complaint.priority); }, [complaint]);

  // ── Open assign modal & fetch admins ─────────────────────────────────────
  const openAssignModal = async () => {
    setShowAssignModal(true);
    if (admins.length) return;
    try {
      setAdminsLoading(true);
      const data = await complaintsAPI.getAdmins(token);
      setAdmins(data.admins || []);
    } catch (err) { console.error(err); }
    finally { setAdminsLoading(false); }
  };

  const handleAdminSelect = (adminId) => {
    const sel = admins.find(a => a._id === adminId);
    setAssignData(prev => ({ ...prev, assignedTo: adminId, department: sel?.department || prev.department }));
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.updateStatus(token, complaintId, { ...statusData, priority: currentPriority });
      setShowStatusUpdate(false);
      setStatusData({ status: '', comment: '' });
      fetchComplaint();
    } catch (err) { alert('Failed to update status: ' + err.message); }
    finally { setUpdating(false); }
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
    } catch (err) { alert('Failed to assign: ' + err.message); }
    finally { setUpdating(false); }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.resolve(token, complaintId, resolveComment);
      setShowResolveModal(false);
      setResolveComment('');
      fetchComplaint();
    } catch (err) { alert('Failed to resolve: ' + err.message); }
    finally { setUpdating(false); }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    try {
      setUpdating(true);
      await complaintsAPI.reject(token, complaintId, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
      fetchComplaint();
    } catch (err) { alert('Failed to reject: ' + err.message); }
    finally { setUpdating(false); }
  };

  const handleRequestInfo = async (e) => {
    e.preventDefault();
    if (!infoQuestion.trim()) return;
    try {
      setUpdating(true);
      await complaintsAPI.requestMoreInfo(token, complaintId, infoQuestion.trim());
      setShowRequestInfoModal(false);
      setInfoQuestion('');
      fetchComplaint();
    } catch (err) { alert('Failed to send request: ' + err.message); }
    finally { setUpdating(false); }
  };

  const handleSubmitInfo = async (e) => {
    e.preventDefault();
    if (!infoResponse.trim()) return;
    try {
      setUpdating(true);
      const fd = new FormData();
      fd.append('response', infoResponse.trim());
      infoFiles.forEach(f => fd.append('attachments', f));
      await complaintsAPI.submitAdditionalInfo(token, complaintId, fd);
      setShowSubmitInfoPanel(false);
      setInfoResponse('');
      setInfoFiles([]);
      fetchComplaint();
    } catch (err) { alert('Failed to submit info: ' + err.message); }
    finally { setUpdating(false); }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    try {
      setSendingReply(true);
      await complaintsAPI.addReply(token, complaintId, replyMessage.trim());
      setReplyMessage('');
      fetchComplaint();
    } catch (err) { alert('Failed to send reply: ' + err.message); }
    finally { setSendingReply(false); }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.addFeedback(token, complaintId, feedbackData);
      setShowFeedback(false);
      fetchComplaint();
    } catch (err) { alert('Failed to submit feedback: ' + err.message); }
    finally { setUpdating(false); }
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

  const isResolved        = ['Resolved', 'Closed', 'Rejected'].includes(complaint.status);
  const isRejected        = complaint.status === 'Rejected';
  const assignmentHistory = complaint.assignmentHistory || [];
  const adminReplies      = complaint.adminReplies || [];
  const infoRequests      = complaint.additionalInfoRequests || [];
  const infoSubmissions   = complaint.additionalInfoSubmissions || [];
  const hasUnanswered     = infoRequests.some(r => !r.answered);
  const baseURL           = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6">

      {/* Back */}
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to List
      </button>

      {/* ── Student: pending info-request alert ───────────────────────────── */}
      {!isAdmin && complaint.pendingInfoRequest && hasUnanswered && !isResolved  && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
          <HelpCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">An admin has requested more information</p>
            <p className="text-sm text-amber-700 mt-0.5">Please scroll down to see the question and add your response.</p>
          </div>
          <button
            onClick={() => setShowSubmitInfoPanel(true)}
            className="text-sm font-semibold text-amber-800 underline whitespace-nowrap"
          >
            Respond now ↓
          </button>
        </div>
      )}

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <Card>
        {/* Title + action buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{complaint.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={complaint.status} />
              {!['Open', 'Rejected'].includes(complaint.status) && (
                <StatusBadge priority={complaint.priority} type="priority" />
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2 flex-wrap self-start">
              {!isResolved && (
                <>
                  {/* Assign / Re-assign */}
                  <button
                    onClick={openAssignModal}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <UserCheck className="h-4 w-4" />
                    {complaint.assignedTo ? 'Re-assign' : 'Assign'}
                  </button>

                  {/* Request Info */}
                  <button
                    onClick={() => setShowRequestInfoModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-gray-300 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    Request Info
                  </button>

                  {/* Resolve */}
                  <button
                    onClick={() => setShowResolveModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-gray-300 text-gray-700 bg-green-600 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Resolve
                  </button>

                  {/* Reject */}
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-300 text-white bg-red-600 hover:bg-red-300 rounded-lg transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>

                  {/* Update Status */}
                  <button
                    onClick={() => setShowStatusUpdate(true)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Update Status
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Rejection banner */}
        {isRejected && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">This complaint was rejected</p>
              {complaint.rejectionReason && (
                <p className="text-sm text-red-600 mt-0.5">Reason: {complaint.rejectionReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Currently assigned banner */}
        {complaint.assignedTo && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl mb-4">
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

        {/* Submitter stats (admin + non-anonymous only) */}
        {isAdmin && !complaint.anonymous && submitterStats && (
          <SubmitterStats stats={submitterStats} name={complaint.submittedBy?.name} />
        )}

        {/* Details */}
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

        {/* Original attachments */}
        {complaint.attachments?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Attachments</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {complaint.attachments.map((file, i) => {
                const url     = `${baseURL}/${file.path}`;
                const isImage = file.mimetype?.startsWith('image/');
                return (
                  <div key={i} className="border rounded-xl p-2">
                    {isImage ? (
                      <img src={url} alt={file.originalName} className="w-full max-h-64 object-contain rounded-lg border bg-gray-50" />
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 underline text-sm break-words">
                        <FileText className="h-4 w-4 flex-shrink-0" /> {file.originalName}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── Additional Info Thread ─────────────────────────────────────────── */}
      {(infoRequests.length > 0 || infoSubmissions.length > 0) && (
        <Card>
          <SectionHeader icon={HelpCircle} title="Additional Information Thread" iconColor="text-amber-500" />

          <div className="space-y-4">
            {infoRequests.map((req, i) => {
              // submissions that fall between this request and the next
              const nextTs   = infoRequests[i + 1]?.timestamp;
              const matching = infoSubmissions.filter(s =>
                new Date(s.timestamp) > new Date(req.timestamp) &&
                (!nextTs || new Date(s.timestamp) < new Date(nextTs))
              );

              return (
                <React.Fragment key={req._id || i}>
                  {/* Admin question */}
                  <div className="flex gap-3">
                    <Avatar name={req.requestedBy?.name} />
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl rounded-tl-none px-4 py-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                        <span className="font-semibold text-gray-800 text-sm">{req.requestedBy?.name || 'Admin'}</span>
                        <span className="text-xs text-gray-500">requested more information</span>
                        <span className="text-xs text-gray-400 ml-auto">{formatDate(req.timestamp)}</span>
                      </div>
                      <p className="text-sm text-gray-800 font-medium">{req.question}</p>
                      {req.answered && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" /> Answered
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Student responses for this request */}
                  {matching.map((sub, j) => (
                    <div key={j} className="flex gap-3 pl-8">
                      <Avatar name={sub.submittedBy?.name} />
                      <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl rounded-tl-none px-4 py-3">
                        <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                          <span className="font-semibold text-gray-800 text-sm">{sub.submittedBy?.name || 'Student'}</span>
                          <span className="text-xs text-gray-500">responded</span>
                          <span className="text-xs text-gray-400 ml-auto">{formatDate(sub.timestamp)}</span>
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{sub.response}</p>

                        {/* Attachments in response */}
                        {sub.attachments?.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {sub.attachments.map((f, k) => {
                              const url     = `${baseURL}/${f.path}`;
                              const isImage = f.mimetype?.startsWith('image/');
                              return (
                                <div key={k} className="border rounded-lg p-1.5 bg-white">
                                  {isImage ? (
                                    <img src={url} alt={f.originalName} className="w-full max-h-40 object-contain rounded" />
                                  ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 underline text-xs">
                                      <FileText className="h-3 w-3" /> {f.originalName}
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </React.Fragment>
              );
            })}
          </div>

          {/* Student: submit response panel */}
          {!isAdmin && hasUnanswered && !isResolved && (
            <div className="mt-5 pt-4 border-t border-amber-100">
              {!showSubmitInfoPanel ? (
                <button
                  onClick={() => setShowSubmitInfoPanel(true)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-400 hover:bg-amber-100 rounded-xl transition-colors"
                >
                  <Send className="h-4 w-4" /> Provide Additional Information
                </button>
              ) : (
                <form onSubmit={handleSubmitInfo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Your Response *</label>
                    <textarea
                      value={infoResponse}
                      onChange={e => setInfoResponse(e.target.value)}
                      placeholder="Describe the additional information here..."
                      rows={4}
                      required
                      className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    />
                  </div>

                  {/* File attachment */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Attach Photos / Documents <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <div
                      onClick={() => infoFileRef.current?.click()}
                      className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-amber-400 transition-colors"
                    >
                      <Paperclip className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {infoFiles.length
                          ? `${infoFiles.length} file(s) selected — click to change`
                          : 'Click to attach photos or documents'}
                      </span>
                    </div>
                    <input
                      ref={infoFileRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={e => setInfoFiles(Array.from(e.target.files))}
                    />
                    {infoFiles.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {infoFiles.map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                            <FileText className="h-3 w-3 text-gray-400" /> {f.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowSubmitInfoPanel(false); setInfoResponse(''); setInfoFiles([]); }}
                      disabled={updating}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating || !infoResponse.trim()}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-colors disabled:opacity-50"
                    >
                      {updating
                        ? <><RefreshCw className="h-4 w-4 animate-spin" /> Submitting…</>
                        : <><Send className="h-4 w-4" /> Submit Response</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Assignment Trail ───────────────────────────────────────────────── */}
      {assignmentHistory.length > 0 && (
        <Card>
          <button
            className="flex items-center justify-between w-full"
            onClick={() => setShowAssignHistory(v => !v)}
          >
            <SectionHeader icon={UserCheck} title="Assignment Trail" count={assignmentHistory.length} />
            {showAssignHistory
              ? <ChevronUp className="h-5 w-5 text-gray-400" />
              : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>

          {showAssignHistory && (
            <div className="mt-2">
              {assignmentHistory.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-100 mt-1 flex-shrink-0" />
                    {i < assignmentHistory.length - 1 && (
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
                          Assigned by{' '}
                          <span className="font-medium text-gray-600">{entry.assignedBy?.name || 'Admin'}</span>
                          {' · '}{formatDate(entry.timestamp)}
                        </p>
                        {entry.note && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Note: </span>
                            {entry.note}
                          </div>
                        )}
                      </div>
                      {i === assignmentHistory.length - 1 && (
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

      {/* ── Admin Replies ──────────────────────────────────────────────────── */}
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
              {adminReplies.map((reply, i) => (
                <div key={i} className="flex gap-3">
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

      {/* ── Status History ─────────────────────────────────────────────────── */}
      {complaint.statusHistory?.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Status History</h2>
          <div className="space-y-4">
            {complaint.statusHistory.map((h, i) => (
              <div key={i} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0">
                <div className="flex-shrink-0 mt-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${h.status === 'Rejected' ? 'bg-red-100' : 'bg-blue-100'}`}>
                    {h.status === 'Rejected'
                      ? <XCircle className="h-5 w-5 text-red-600" />
                      : <CheckCircle className="h-5 w-5 text-blue-600" />}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={h.status} />
                    <span className="text-sm text-gray-500">{formatDate(h.timestamp)}</span>
                  </div>
                  {h.comment && <p className="text-sm text-gray-700 mt-2">{h.comment}</p>}
                  {h.updatedBy && <p className="text-xs text-gray-500 mt-1">Updated by {h.updatedBy.name || 'Admin'}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Feedback ───────────────────────────────────────────────────────── */}
      {complaint.status === 'Resolved' && !complaint.feedback && !showFeedback && !isAdmin && (
        <Card>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Complaint Resolved</h3>
            <p className="text-gray-600 mb-4">How was your experience with the resolution?</p>
            <Button variant="primary" onClick={() => setShowFeedback(true)}>Provide Feedback</Button>
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

      {/* ════════════════════ MODALS ════════════════════════════════════════ */}

      {/* Assign / Re-assign */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
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
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Admin *</label>
                  <div className="space-y-4 overflow-y-auto px-4 pr-2" style={{ maxHeight: "200px" }} >
                    {admins.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No admins found.</p>
                    ) : admins.map(admin => (
                      <label
                        key={admin._id}
                        className={`admin-card flex items-center gap-8 p-3 border-2 rounded-xl cursor-pointer px-6  ml-2 transition-all ${
                          assignData.assignedTo === admin._id
                            ? 'selected'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input type="radio" name="assignedTo" value={admin._id}
                          checked={assignData.assignedTo === admin._id}
                          onChange={() => handleAdminSelect(admin._id)}
                          className="custom-radio"
                        />
                        <Avatar name={admin.name} />
                        <div className="flex-1 min-w-0 flex flex-col gap-1 m-4">
                          <p className="font-semiboldv text-gray-800 text-sm">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                          {admin.department && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-1 inline-block">
                              {admin.department}
                            </span>
                          )}
                        </div>
                        {complaint.assignedTo?._id === admin._id && (
                          <span className="text-xs text-green-600 font-semibold">Current</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department <span className="text-gray-400 font-normal">(auto-filled from admin)</span>
                  </label>
                  <input type="text" value={assignData.department}
                    onChange={e => setAssignData(p => ({ ...p, department: e.target.value }))}
                    placeholder="e.g. IT Support, Administration…"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note for Admin</label>
                  <textarea value={assignData.note}
                    onChange={e => setAssignData(p => ({ ...p, note: e.target.value }))}
                    placeholder="Optional instructions or context…"
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)} disabled={updating}>Cancel</Button>
                  <Button type="submit" variant="primary" loading={updating} disabled={!assignData.assignedTo}>
                    {complaint.assignedTo ? 'Re-assign' : 'Assign'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}

      {/* Resolve */}
      {showResolveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-800">Resolve Complaint</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">This will mark the complaint as resolved and the student will be able to leave feedback.</p>
            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resolution Note <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea value={resolveComment}
                  onChange={e => setResolveComment(e.target.value)}
                  placeholder="Briefly describe how this complaint was resolved…"
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowResolveModal(false)} disabled={updating}>Cancel</Button>
                <button type="submit" variant="primary" disabled={updating || !resolveComment.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50">
                  {updating
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Resolving…</>
                    : <><CheckCircle className="h-4 w-4" /> Mark Resolved</>}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Reject */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <XCircle className="h-6 w-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-800">Reject Complaint</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Please provide a clear reason. The student will see this reason so they understand why their complaint was rejected.
            </p>
            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Duplicate complaint, insufficient evidence, outside jurisdiction…"
                rows={4}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowRejectModal(false)} disabled={updating}>Cancel</Button>
                <button type="submit" disabled={updating || !rejectReason.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50">
                  {updating
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Rejecting…</>
                    : <><XCircle className="h-4 w-4" /> Confirm Rejection</>}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Request More Info */}
      {showRequestInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="h-6 w-6 text-amber-500" />
              <h2 className="text-xl font-semibold text-gray-800">Request More Information</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              The student will be notified and prompted to respond with additional text, photos, or documents.
            </p>
            <form onSubmit={handleRequestInfo} className="space-y-4">
              <textarea
                value={infoQuestion}
                onChange={e => setInfoQuestion(e.target.value)}
                placeholder="e.g. Can you provide the exact date this occurred? Please attach any photos or supporting documents."
                rows={4}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowRequestInfoModal(false)} disabled={updating}>Cancel</Button>
                <button type="submit" disabled={updating || !infoQuestion.trim()}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-50">
                  {updating
                    ? <><RefreshCw className="h-4 w-4 animate-spin" /> Sending…</>
                    : <><Send className="h-4 w-4" /> Send Request</>}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Update Status */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="   ">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Status</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select value={statusData.status}
                  onChange={e => setStatusData({ ...statusData, status: e.target.value })}
                  required
                  className="block w-full rounded-lg border border-gray-300 px-3 mt-2 mb-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  {Object.values(COMPLAINT_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={currentPriority}
                  onChange={e => setCurrentPriority(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 px-3 mb-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.values(PRIORITIES).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea value={statusData.comment}
                  onChange={e => setStatusData({ ...statusData, comment: e.target.value })}
                  placeholder="Add a comment about this status update..."
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 mt-2 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowStatusUpdate(false)} disabled={updating}>Cancel</Button>
                <Button type="submit" variant="primary" loading={updating}>Update Status</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Feedback */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Provide Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} type="button"
                      onClick={() => setFeedbackData({ ...feedbackData, rating: r })}
                      className="text-3xl focus:outline-none">
                      <span className={r <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea value={feedbackData.comment}
                  onChange={e => setFeedbackData({ ...feedbackData, comment: e.target.value })}
                  placeholder="Share your experience..."
                  rows={4}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowFeedback(false)} disabled={updating}>Cancel</Button>
                <Button type="submit" variant="primary" loading={updating}>Submit Feedback</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
};

export default ComplaintDetail;