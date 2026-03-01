// src/pages/ComplaintDetail.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, AlertCircle, CheckCircle, UserCheck, MessageSquare,
  Send, ChevronDown, ChevronUp, XCircle, HelpCircle, PaperclipIcon,
  FileText, BarChart2
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const Avatar = ({ name, size = 'sm' }) => {
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const cls = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initials}
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title, count, color = 'blue' }) => {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-100 text-blue-700',
    red: 'text-red-600 bg-red-100 text-red-700',
    amber: 'text-amber-600 bg-amber-100 text-amber-700',
    green: 'text-green-600 bg-green-100 text-green-700',
  };
  const [iconColor, badgeBg, badgeText] = colorMap[color].split(' ');
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`h-5 w-5 ${iconColor}`} />
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {count !== undefined && (
        <span className={`ml-1 px-2 py-0.5 text-xs font-semibold ${badgeBg} ${badgeText} rounded-full`}>{count}</span>
      )}
    </div>
  );
};

// Submitter credibility mini-widget shown to admins
const SubmitterStats = ({ stats, name }) => {
  if (!stats) return null;
  const pct = stats.total > 0 ? Math.round((stats.genuine / stats.total) * 100) : 100;
  const barColor = pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg mb-4">
      <BarChart2 className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
          Submitter history — {name}
        </p>
        <div className="flex gap-4 text-sm mb-2">
          <span><span className="font-bold text-gray-800">{stats.total}</span> <span className="text-gray-500">total</span></span>
          <span><span className="font-bold text-green-700">{stats.genuine}</span> <span className="text-gray-500">genuine</span></span>
          <span><span className="font-bold text-red-600">{stats.rejected}</span> <span className="text-gray-500">rejected</span></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div className={`${barColor} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 mt-1">{pct}% genuine rate</p>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ComplaintDetail = ({ complaintId, onBack }) => {
  const { token, hasRole } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [submitterStats, setSubmitterStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Panel toggles
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAssignHistory, setShowAssignHistory] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRequestInfoModal, setShowRequestInfoModal] = useState(false);
  const [showSubmitInfoPanel, setShowSubmitInfoPanel] = useState(false);

  // Form states
  const [statusData, setStatusData] = useState({ status: '', comment: '' });
  const [currentPriority, setCurrentPriority] = useState('');
  const [feedbackData, setFeedbackData] = useState({ rating: 5, comment: '' });
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [infoQuestion, setInfoQuestion] = useState('');
  const [infoResponse, setInfoResponse] = useState('');
  const [infoFiles, setInfoFiles] = useState([]);
  const infoFileRef = useRef(null);

  // Assign
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [assignData, setAssignData] = useState({ assignedTo: '', department: '', note: '' });

  const isAdmin = hasRole(ROLES.ADMIN) || hasRole(ROLES.SUPERADMIN);

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchComplaint = useCallback(async () => {
    try {
      setLoading(true);
      const data = await complaintsAPI.getById(token, complaintId);
      setComplaint(data.complaint || data);
      setSubmitterStats(data.submitterStats || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, complaintId]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);
  useEffect(() => { if (complaint) setCurrentPriority(complaint.priority); }, [complaint]);

  // ── Assign helpers ───────────────────────────────────────────────────────
  const openAssignModal = async () => {
    setShowAssignModal(true);
    if (admins.length) return;
    try {
      setAdminsLoading(true);
      const data = await complaintsAPI.getAdmins(token);
      setAdmins(data.admins || []);
    } catch (e) { console.error(e); }
    finally { setAdminsLoading(false); }
  };

  const handleAdminSelect = (adminId) => {
    const sel = admins.find(a => a._id === adminId);
    setAssignData(p => ({ ...p, assignedTo: adminId, department: sel?.department || p.department }));
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
    } catch (err) { alert('Failed: ' + err.message); }
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
    } catch (err) { alert('Failed: ' + err.message); }
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
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setSendingReply(false); }
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
    } catch (err) { alert('Failed: ' + err.message); }
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
    } catch (err) { alert('Failed: ' + err.message); }
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
    } catch (err) { alert('Failed: ' + err.message); }
    finally { setUpdating(false); }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await complaintsAPI.addFeedback(token, complaintId, feedbackData);
      setShowFeedback(false);
      fetchComplaint();
    } catch (err) { alert('Failed: ' + err.message); }
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

  const isResolved = ['Resolved', 'Closed', 'Rejected'].includes(complaint.status);
  const isRejected = complaint.status === 'Rejected';
  const assignmentHistory = complaint.assignmentHistory || [];
  const adminReplies = complaint.adminReplies || [];
  const infoRequests = complaint.additionalInfoRequests || [];
  const infoSubmissions = complaint.additionalInfoSubmissions || [];
  const hasUnansweredRequest = infoRequests.some(r => !r.answered);
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  return (
    <div className="space-y-6">

      {/* Back */}
      <button onClick={onBack} className="flex items-center text-gray-600 hover:text-gray-800 transition-colors">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to List
      </button>

      {/* ── STUDENT: pending info-request alert banner ─────────────────── */}
      {!isAdmin && complaint.pendingInfoRequest && hasUnansweredRequest && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
          <HelpCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">Admin is requesting more information</p>
            <p className="text-sm text-amber-700 mt-0.5">Please scroll down to see the question and submit your response.</p>
          </div>
          <button
            onClick={() => setShowSubmitInfoPanel(true)}
            className="text-sm font-semibold text-amber-800 underline whitespace-nowrap"
          >
            Respond now
          </button>
        </div>
      )}

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{complaint.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge status={complaint.status} />
              {complaint.status !== 'Open' && !isRejected && (
                <StatusBadge priority={complaint.priority} type="priority" />
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="flex gap-2 flex-wrap self-start">
              {!isResolved && (
                <>
                  <Button variant="outline" icon={UserCheck} onClick={openAssignModal} size="sm">
                    {complaint.assignedTo ? 'Re-assign' : 'Assign'}
                  </Button>
                  <Button
                    variant="outline"
                    icon={HelpCircle}
                    onClick={() => setShowRequestInfoModal(true)}
                    size="sm"
                    className="border-amber-400 text-amber-700 hover:bg-amber-50"
                  >
                    Request Info
                  </Button>
                  <Button
                    variant="outline"
                    icon={XCircle}
                    onClick={() => setShowRejectModal(true)}
                    size="sm"
                    className="border-red-400 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                  <Button variant="primary" onClick={() => setShowStatusUpdate(true)} size="sm">
                    Update Status
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Rejection banner */}
        {isRejected && (
          <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700">This complaint was rejected</p>
              {complaint.rejectionReason && (
                <p className="text-sm text-red-600 mt-0.5">Reason: {complaint.rejectionReason}</p>
              )}
            </div>
          </div>
        )}

        {/* Currently assigned */}
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

        {/* Submitter stats (admin only, non-anonymous) */}
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
                const url = `${baseURL}/${file.path}`;
                const isImg = file.mimetype?.startsWith('image/');
                return (
                  <div key={i} className="border rounded-lg p-2">
                    {isImg ? (
                      <img src={url} alt={file.originalName} className="w-full max-h-64 object-contain rounded-lg border bg-gray-50" />
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-words flex items-center gap-1">
                        <FileText className="h-4 w-4 flex-shrink-0" />{file.originalName}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ── Additional Info Thread ──────────────────────────────────────── */}
      {(infoRequests.length > 0 || infoSubmissions.length > 0) && (
        <Card>
          <SectionHeader icon={HelpCircle} title="Additional Information Thread" color="amber" />

          <div className="space-y-4">
            {/* Interleave requests and submissions chronologically */}
            {infoRequests.map((req, i) => {
              // find submissions that came after this request
              const matching = infoSubmissions.filter(
                s => new Date(s.timestamp) > new Date(req.timestamp) &&
                  (i === infoRequests.length - 1 || new Date(s.timestamp) < new Date(infoRequests[i + 1]?.timestamp))
              );
              return (
                <React.Fragment key={req._id || i}>
                  {/* Admin question bubble */}
                  <div className="flex gap-3">
                    <Avatar name={req.requestedBy?.name} />
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl rounded-tl-none px-4 py-3">
                      <div className="flex flex-wrap items-baseline gap-x-2 mb-1">
                        <span className="font-semibold text-gray-800 text-sm">{req.requestedBy?.name || 'Admin'}</span>
                        <span className="text-xs text-gray-500">requested more info</span>
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

                  {/* Matching student responses */}
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
                        {sub.attachments?.length > 0 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            {sub.attachments.map((f, k) => {
                              const url = `${baseURL}/${f.path}`;
                              const isImg = f.mimetype?.startsWith('image/');
                              return (
                                <div key={k} className="border rounded-lg p-1.5 bg-white">
                                  {isImg ? (
                                    <img src={url} alt={f.originalName} className="w-full max-h-40 object-contain rounded" />
                                  ) : (
                                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs flex items-center gap-1">
                                      <FileText className="h-3 w-3" />{f.originalName}
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

          {/* Student: respond button / panel */}
          {!isAdmin && hasUnansweredRequest && !isResolved && (
            <div className="mt-4 pt-4 border-t border-amber-100">
              {!showSubmitInfoPanel ? (
                <Button
                  variant="outline"
                  icon={Send}
                  onClick={() => setShowSubmitInfoPanel(true)}
                  className="border-amber-400 text-amber-700 hover:bg-amber-50"
                >
                  Provide Additional Information
                </Button>
              ) : (
                <form onSubmit={handleSubmitInfo} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Your Response *</label>
                  <textarea
                    value={infoResponse}
                    onChange={e => setInfoResponse(e.target.value)}
                    placeholder="Provide the requested information here..."
                    rows={4}
                    required
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attach supporting files <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <div
                      className="flex items-center gap-3 border-2 border-dashed border-gray-300 rounded-xl p-3 cursor-pointer hover:border-amber-400 transition-colors"
                      onClick={() => infoFileRef.current?.click()}
                    >
                      <PaperclipIcon className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {infoFiles.length ? `${infoFiles.length} file(s) selected` : 'Click to attach files'}
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
                          <li key={i} className="text-xs text-gray-600 flex items-center gap-1">
                            <FileText className="h-3 w-3" />{f.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" onClick={() => { setShowSubmitInfoPanel(false); setInfoFiles([]); setInfoResponse(''); }} disabled={updating}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={updating}>
                      Submit Response
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── Assignment History ──────────────────────────────────────────── */}
      {assignmentHistory.length > 0 && (
        <Card>
          <button className="flex items-center justify-between w-full" onClick={() => setShowAssignHistory(v => !v)}>
            <SectionHeader icon={UserCheck} title="Assignment Trail" count={assignmentHistory.length} />
            {showAssignHistory ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
          </button>

          {showAssignHistory && (
            <div className="mt-2">
              {assignmentHistory.map((entry, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-100 mt-1 flex-shrink-0" />
                    {i < assignmentHistory.length - 1 && <div className="w-0.5 bg-blue-100 flex-1 my-1" />}
                  </div>
                  <div className="pb-5 flex-1">
                    <div className="flex items-start gap-3">
                      <Avatar name={entry.assignedTo?.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-semibold text-gray-800">{entry.assignedTo?.name || 'Unknown'}</span>
                          {entry.assignedTo?.department && (
                            <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{entry.assignedTo.department}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Assigned by <span className="font-medium text-gray-600">{entry.assignedBy?.name || 'Admin'}</span>
                          {' · '}{formatDate(entry.timestamp)}
                        </p>
                        {entry.note && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Note: </span>{entry.note}
                          </div>
                        )}
                      </div>
                      {i === assignmentHistory.length - 1 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium flex-shrink-0">Current</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Admin Replies ───────────────────────────────────────────────── */}
      {(adminReplies.length > 0 || isAdmin) && (
        <Card>
          <SectionHeader icon={MessageSquare} title={isAdmin ? 'Admin Replies' : 'Updates from Administration'} count={adminReplies.length} />

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
                      {reply.admin?.department && <span className="text-xs text-gray-500">· {reply.admin.department}</span>}
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(reply.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reply.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isAdmin && (
            <form onSubmit={handleSendReply} className="flex gap-3 pt-4 border-t border-gray-100">
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

      {/* ── Status History ──────────────────────────────────────────────── */}
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
                      : <CheckCircle className="h-5 w-5 text-blue-600" />
                    }
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

      {/* ── Feedback ────────────────────────────────────────────────────── */}
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

      {/* ═══════════════ MODALS ════════════════════════════════════════════ */}

      {/* Assign */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <UserCheck className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-800">{complaint.assignedTo ? 'Re-assign' : 'Assign'} Complaint</h2>
            </div>
            {adminsLoading ? <div className="flex justify-center py-8"><LoadingSpinner /></div> : (
              <form onSubmit={handleAssign} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Admin *</label>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {admins.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No admins found.</p>
                    ) : admins.map(admin => (
                      <label key={admin._id} className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${assignData.assignedTo === admin._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" name="assignedTo" value={admin._id} checked={assignData.assignedTo === admin._id} onChange={() => handleAdminSelect(admin._id)} className="sr-only" />
                        <Avatar name={admin.name} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 text-sm">{admin.name}</p>
                          <p className="text-xs text-gray-500">{admin.email}</p>
                          {admin.department && <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full mt-1 inline-block">{admin.department}</span>}
                        </div>
                        <span className="text-xs text-gray-400 capitalize">{admin.role}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-gray-400 font-normal">(auto-filled)</span></label>
                  <input type="text" value={assignData.department} onChange={e => setAssignData(p => ({ ...p, department: e.target.value }))} placeholder="e.g. IT Support…" className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Note for Admin</label>
                  <textarea value={assignData.note} onChange={e => setAssignData(p => ({ ...p, note: e.target.value }))} placeholder="Optional instructions…" rows={3} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowAssignModal(false)} disabled={updating}>Cancel</Button>
                  <Button type="submit" variant="primary" loading={updating} disabled={!assignData.assignedTo}>{complaint.assignedTo ? 'Re-assign' : 'Assign'}</Button>
                </div>
              </form>
            )}
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
            <p className="text-sm text-gray-600 mb-4">Please provide a clear reason so the student understands why this complaint was rejected.</p>
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
                <Button type="submit" loading={updating} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  Confirm Rejection
                </Button>
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
            <p className="text-sm text-gray-600 mb-4">The student will see your question and be prompted to respond with additional details or files.</p>
            <form onSubmit={handleRequestInfo} className="space-y-4">
              <textarea
                value={infoQuestion}
                onChange={e => setInfoQuestion(e.target.value)}
                placeholder="e.g. Can you provide the date this issue occurred? Please attach any photos or documents."
                rows={4}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
              />
              <div className="flex gap-3 justify-end">
                <Button type="button" variant="secondary" onClick={() => setShowRequestInfoModal(false)} disabled={updating}>Cancel</Button>
                <Button type="submit" loading={updating} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  Send Request
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Status Update */}
      {showStatusUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Update Status</h2>
            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Status</label>
                <select value={statusData.status} onChange={e => setStatusData({ ...statusData, status: e.target.value })} required className="block w-full rounded-lg border border-gray-300 px-3 mt-2 mb-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select status</option>
                  {Object.values(COMPLAINT_STATUS).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={currentPriority} onChange={e => setCurrentPriority(e.target.value)} className="block w-full rounded-lg border border-gray-300 px-3 mb-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.values(PRIORITIES).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea value={statusData.comment} onChange={e => setStatusData({ ...statusData, comment: e.target.value })} placeholder="Add a comment..." rows={4} className="block w-full rounded-lg border border-gray-300 mt-2 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                  {[1,2,3,4,5].map(r => (
                    <button key={r} type="button" onClick={() => setFeedbackData({ ...feedbackData, rating: r })} className="text-3xl focus:outline-none">
                      <span className={r <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'}>★</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                <textarea value={feedbackData.comment} onChange={e => setFeedbackData({ ...feedbackData, comment: e.target.value })} placeholder="Share your experience..." rows={4} className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
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