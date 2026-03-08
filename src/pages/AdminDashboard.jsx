// src/pages/AdminDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, CheckCircle, AlertCircle,
  UserCheck, ChevronRight, RefreshCw, LayoutDashboard,
  List, Inbox, Send
} from 'lucide-react';
// import StatsCard from '../components/dashboard/StatsCard';
import Card from '../components/common/Card';
import StatusBadge from '../components/common/StatusBadge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { complaintsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getRelativeTime, truncateText } from '../utils/helpers';
// import { PRIORITIES, COMPLAINT_STATUS, CATEGORIES } from '../utils/constants';

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

const PriorityDot = ({ priority }) => {
  const colors = {
    Critical: 'bg-red-500',
    High: 'bg-orange-500',
    Medium: 'bg-yellow-500',
    Low: 'bg-green-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[priority] || 'bg-gray-400'} flex-shrink-0`} />;
};

// Assign modal — reusable inside dashboard
const AssignModal = ({ complaint, token, onClose, onSuccess }) => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState('');
  const [department, setDepartment] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    complaintsAPI.getAdmins(token)
      .then(d => setAdmins(d.admins || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleAdminSelect = (id) => {
    setSelected(id);
    const a = admins.find(a => a._id === id);
    setDepartment(a?.department || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      await complaintsAPI.assign(token, complaint._id, { assignedTo: selected, department, note });
      onSuccess();
    } catch (err) {
      alert('Failed to assign: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md  p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center m-4 gap-2">
            <UserCheck className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">
              {complaint.assignedTo ? 'Re-assign Complaint' : 'Assign Complaint'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>

        {/* Complaint preview */}
        <div className="p-3 bg-gray-50 rounded-xl mb-4 border border-gray-200 m-2 flex flex-col gap-3">
          <p className="font-semibold text-gray-800 text-sm truncate">{complaint.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{complaint.category} · {complaint.status}</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Select Admin *</label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1 flex justify-between items-start flex-col gap-4 px-4" style={{ maxHeight: "200px" }} >
                {admins.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No admins found.</p>
                ) : admins.map(admin => (
                  <label
                    key={admin._id}
                    className={`admin-card flex items-center gap-8 p-3 border-2 rounded-xl cursor-pointer px-6  ml-2 transition-all ${
                      selected === admin._id
                        ? 'selected'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="admin"
                      value={admin._id}
                      checked={selected === admin._id}
                      onChange={() => handleAdminSelect(admin._id)}
                      className="custom-radio"
                    />

                    <Avatar name={admin.name} />

                    <div className="flex-1 min-w-0 flex flex-col gap-1 m-4">
                      <p className="font-semibold text-gray-800 text-sm">{admin.name}</p>
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
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Department <span className="font-normal text-gray-400">(auto-filled)</span>
              </label>
              <input
                type="text" value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. IT Support, Administration…"
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Note for Admin</label>
              <textarea
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="Optional instructions or context for the assigned admin…"
                rows={3}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={onClose} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={!selected || saving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Assigning…</> : <><Send className="h-4 w-4" /> {complaint.assignedTo ? 'Re-assign' : 'Assign'}</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Resolve quick modal
const ResolveModal = ({ complaint, token, onClose, onSuccess }) => {
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await complaintsAPI.resolve(token, complaint._id, comment);
      onSuccess();
    } catch (err) {
      alert('Failed to resolve: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-800">Resolve Complaint</h2>
        </div>
        <div className="p-3 bg-gray-50 rounded-xl mb-4 border border-gray-200">
          <p className="font-semibold text-gray-800 text-sm truncate">{complaint.title}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Resolution Note</label>
            <textarea
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Briefly describe how this complaint was resolved…"
              rows={4}
              className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !comment.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? <><RefreshCw className="h-4 w-4 animate-spin" /> Resolving…</> : <><CheckCircle className="h-4 w-4" /> Mark Resolved</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Shared complaint card used in all tabs ────────────────────────────────────
const ComplaintCard = ({ complaint, onNavigate, onAssign, onResolve, showActions = false }) => (
  <div className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-all bg-white">
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
      {/* Left: title + meta */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNavigate('complaint-detail', complaint._id)}
      >
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <PriorityDot priority={complaint.priority} />
          <h3 className="font-semibold text-gray-800 truncate">{complaint.title}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-2 line-clamp-2">
          {truncateText(complaint.description, 110)}
        </p>
        <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500">
          <StatusBadge status={complaint.status} />
          {complaint.status !== 'Open' && (
            <StatusBadge priority={complaint.priority} type="priority" />
          )}
          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{complaint.category}</span>
          {complaint.anonymous ? (
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Anonymous</span>
          ) : (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
              {complaint.submittedBy?.name || 'Unknown'}
            </span>
          )}
          <span className="text-gray-400 ml-auto">{getRelativeTime(complaint.createdAt)}</span>
        </div>
      </div>

      {/* Right: action buttons (shown in My Assigned tab) */}
      {showActions && (
        <div className="flex flex-row sm:flex-col gap-2 sm:min-w-[120px]">
          {complaint.status !== 'Resolved' && complaint.status !== 'Rejected' && (
            <>
              <button
                onClick={() => onResolve(complaint)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              >
                <CheckCircle className="h-3.5 w-3.5" /> Resolve
              </button>
              <button
                onClick={() => onAssign(complaint)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Re-assign
              </button>
            </>
          )}
          <button
            onClick={() => onNavigate('complaint-detail', complaint._id)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
          >
            <ChevronRight className="h-3.5 w-3.5" /> View
          </button>
        </div>
      )}
    </div>
  </div>
);

// ── TAB: Overview ─────────────────────────────────────────────────────────────
const OverviewTab = ({ token, onNavigate, onSwitchTab, isSuperAdmin }) => {
  const [allComplaints, setAllComplaints] = useState([]);
  const [myAssigned, setMyAssigned] = useState([]);
  const [myStats, setMyStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, escalated: 0, rejected: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [all, mine] = await Promise.all([
        complaintsAPI.getAll(token),
        complaintsAPI.getMyAssigned(token),
      ]);
      const allList = all.complaints || [];
      const mineList = mine.complaints || [];
      setAllComplaints(allList);
      setMyAssigned(mineList);
      setMyStats(mine.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, rejected: 0 });
      setGlobalStats({
        total: allList.length,
        open: allList.filter(c => c.status === 'Open').length,
        inProgress: allList.filter(c => c.status === 'In Progress').length,
        resolved: allList.filter(c => c.status === 'Resolved').length,
        critical: allList.filter(c => c.priority === 'Critical').length,
        escalated: allList.filter(c => c.status === 'Escalated').length,
        rejected: allList.filter(c => c.status === 'Rejected').length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner fullScreen />;

  const urgentAll = allComplaints
    .filter(c => c.status === 'Open' && !c.assignedTo)
    .sort((a, b) => ({ Critical: 0, High: 1, Medium: 2, Low: 3 }[a.priority] - { Critical: 0, High: 1, Medium: 2, Low: 3 }[b.priority]));

  const myPending = myAssigned.filter(c => c.status === 'In Progress' || c.status === 'Open');

  return (
    <div className="space-y-6">
      {/* Global stats */}
      {isSuperAdmin && (<div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">System Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total', value: globalStats.total, color: 'text-indigo-700 bg-indigo-50' },
            { label: 'Open', value: globalStats.open, color: 'text-yellow-600 bg-yellow-50' },
            { label: 'In Progress', value: globalStats.inProgress, color: 'text-blue-600 bg-blue-50' },
            { label: 'Resolved', value: globalStats.resolved, color: 'text-green-600 bg-green-50' },
            { label: 'Critical', value: globalStats.critical, color: 'text-red-700 bg-red-300' },
            { label: 'Escalated', value: globalStats.escalated, color: 'text-orange-600 bg-orange-50' },
            { label: 'Rejected', value: globalStats.rejected, color: 'text-red-600 bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>)}

      {/* My workload summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">My Workload</h2>
          <button onClick={() => onSwitchTab('assigned')} className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1">
            View all mine <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Assigned to me', value: myStats.total, color: 'text-indigo-700 bg-indigo-50' },
            { label: 'Pending (Open + In Progress)', value: (myStats.open || 0) + (myStats.inProgress || 0), color: 'text-amber-600 bg-amber-50' },
            { label: 'Resolved', value: myStats.resolved, color: 'text-green-600 bg-green-50' },
            { label: 'Critical', value: myStats.critical, color: 'text-red-700 bg-red-300' },
            { label: 'Rejected', value: myStats.rejected, color: 'text-red-600 bg-red-50' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unassigned / urgent */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h3 className="font-semibold text-gray-800">Unassigned & Urgent</h3>
              {urgentAll.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-red-100 text-red-700 rounded-full">{urgentAll.length}</span>
              )}
            </div>
            <button onClick={() => onSwitchTab('all')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {urgentAll.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-2" />
              <p className="text-sm">All complaints are assigned!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentAll.slice(0, 4).map(c => (
                <div key={c._id} onClick={() => onNavigate('complaint-detail', c._id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <PriorityDot priority={c.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.category} · {getRelativeTime(c.createdAt)}</p>
                  </div>
                  <StatusBadge priority={c.priority} type="priority" />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* My pending */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-gray-800">My Pending</h3>
              {myPending.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-blue-100 text-blue-700 rounded-full">{myPending.length}</span>
              )}
            </div>
            <button onClick={() => onSwitchTab('assigned')} className="text-xs text-blue-600 hover:underline font-medium">View all</button>
          </div>
          {myPending.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-2" />
              <p className="text-sm">No pending complaints assigned to you!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPending.slice(0, 4).map(c => (
                <div key={c._id} onClick={() => onNavigate('complaint-detail', c._id)}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <PriorityDot priority={c.priority} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.category} · {getRelativeTime(c.createdAt)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

// ── TAB: All Complaints ───────────────────────────────────────────────────────
const AllComplaintsTab = ({ token, onNavigate, onAssign, onResolve }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssigned, setFilterAssigned] = useState(''); // 'unassigned' | 'assigned' | ''

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await complaintsAPI.getAll(token);
      setComplaints(data.complaints || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const filtered = complaints.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterPriority && c.priority !== filterPriority) return false;
    if (filterAssigned === 'unassigned' && c.assignedTo) return false;
    if (filterAssigned === 'assigned' && !c.assignedTo) return false;
    return true;
  });

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
        <input
          type="text" placeholder="Search complaints…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Statuses</option>
          {['Open', 'In Progress', 'Resolved', 'Rejected', 'Escalated'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Priorities</option>
          {['Critical', 'High', 'Medium', 'Low'].map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={filterAssigned} onChange={e => setFilterAssigned(e.target.value)}
          className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
          <option value="">All Assignments</option>
          <option value="unassigned">Unassigned</option>
          <option value="assigned">Assigned</option>
        </select>
        {(search || filterStatus || filterPriority || filterAssigned) && (
          <button onClick={() => { setSearch(''); setFilterStatus(''); setFilterPriority(''); setFilterAssigned(''); }}
            className="text-sm text-red-500 hover:text-red-700 font-medium px-2">Clear</button>
        )}
      </div>

      <p className="text-sm text-gray-500 px-1">Showing {filtered.length} of {complaints.length} complaints</p>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No complaints match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <div key={c._id} className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate('complaint-detail', c._id)}>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <PriorityDot priority={c.priority} />
                    <h3 className="font-semibold text-gray-800 truncate">{c.title}</h3>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{truncateText(c.description, 110)}</p>
                  <div className="flex flex-wrap gap-2 items-center text-xs">
                    <StatusBadge status={c.status} />
                    {c.status !== 'Open' && <StatusBadge priority={c.priority} type="priority" />}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{c.category}</span>
                    {c.assignedTo ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-200">
                        <UserCheck className="h-3 w-3" />
                        {c.assignedTo.name}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full border border-red-200 font-medium">Unassigned</span>
                    )}
                    <span className="text-gray-400 ml-auto">{getRelativeTime(c.createdAt)}</span>
                  </div>
                </div>
                {/* Quick actions */}
                <div className="flex gap-2 sm:flex-col sm:min-w-[110px]">
                  {c.status !== 'Resolved' && c.status !== 'Rejected'&& c.status !== 'Rejected' && (
                    <>
                      <button onClick={() => onAssign(c)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors">
                        <UserCheck className="h-3.5 w-3.5" />
                        {c.assignedTo ? 'Re-assign' : 'Assign'}
                      </button>
                      <button onClick={() => onResolve(c)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl transition-colors">
                        <CheckCircle className="h-3.5 w-3.5" /> Resolve
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── TAB: My Assigned ──────────────────────────────────────────────────────────
const MyAssignedTab = ({ token, onNavigate, onAssign, onResolve }) => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, rejected:0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await complaintsAPI.getMyAssigned(token, filterStatus ? { status: filterStatus } : {});
      setComplaints(data.complaints || []);
      setStats(data.stats || { total: 0, open: 0, inProgress: 0, resolved: 0, critical: 0, rejected:0  });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [token, filterStatus]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner fullScreen />;

  const pending = complaints.filter(c => c.status === 'Open' || c.status === 'In Progress');
  const resolved = complaints.filter(c => c.status === 'Resolved' || c.status === 'Rejected');

  return (
    <div className="space-y-6">
      {/* My personal stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Assigned', value: stats.total, color: 'text-indigo-700 bg-indigo-50' },
          { label: 'Open', value: stats.open, color: 'text-yellow-600 bg-yellow-50' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-600 bg-blue-50' },
          { label: 'Resolved', value: stats.resolved, color: 'text-green-600 bg-green-50' },
          { label: 'Critical', value: stats.critical, color: 'text-red-700 bg-red-300' },
          { label: 'Rejected', value: stats.rejected, color: 'text-red-600 bg-red-50' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl p-4 text-center ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 flex-wrap">
        {['', 'Open', 'In Progress', 'Resolved', 'Rejected'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {complaints.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="h-14 w-14 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {filterStatus ? `No ${filterStatus} complaints assigned to you.` : 'No complaints assigned to you yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Pending section */}
          {(filterStatus === '' || filterStatus === 'Open' || filterStatus === 'In Progress') && pending.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Pending ({pending.length})
              </h3>
              {pending.map(c => (
                <ComplaintCard
                  key={c._id} complaint={c}
                  onNavigate={onNavigate} onAssign={onAssign} onResolve={onResolve}
                  showActions
                />
              ))}
            </>
          )}

          {/* Resolved section */}
          {(filterStatus === '' || filterStatus === 'Resolved' || filterStatus === 'Rejected') && resolved.length > 0 && (
            <>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mt-4">
                Resolved / Rejected ({resolved.length})
              </h3>
              {resolved.map(c => (
                <ComplaintCard
                  key={c._id} complaint={c}
                  onNavigate={onNavigate} onAssign={onAssign} onResolve={onResolve}
                  showActions={false}
                />
              ))}
            </>
          )}

          {/* Show all if single status filter */}
          {filterStatus && filterStatus !== 'Open' && filterStatus !== 'In Progress' && filterStatus !== 'Resolved' && filterStatus !== 'Rejected' && complaints.map(c => (
            <ComplaintCard
              key={c._id} complaint={c}
              onNavigate={onNavigate} onAssign={onAssign} onResolve={onResolve}
              showActions={c.status !== 'Resolved' && c.status !== 'Rejected'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── MAIN AdminDashboard ───────────────────────────────────────────────────────
const AdminDashboard = ({ onNavigate }) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignTarget, setAssignTarget] = useState(null);   // complaint to assign
  const [resolveTarget, setResolveTarget] = useState(null); // complaint to resolve
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAssignSuccess = () => {
    setAssignTarget(null);
    setRefreshKey(k => k + 1);
  };

  const handleResolveSuccess = () => {
    setResolveTarget(null);
    setRefreshKey(k => k + 1);
  };

  const isSuperAdmin = user?.id === "69a430f1c4294cf75ca5d2c5";

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ...(isSuperAdmin
    ? [{ id: 'all', label: 'All Complaints', icon: List }]
    : []),
    { id: 'assigned', label: 'My Assigned', icon: Inbox },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, <span className="font-semibold text-amber-600 ">{user?.name || 'Admin'}</span>
          </p>
        </div>
        <button onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div key={refreshKey}>
        {activeTab === 'overview' && (
          <OverviewTab token={token} onNavigate={onNavigate} onSwitchTab={setActiveTab} isSuperAdmin={isSuperAdmin}/>
        )}
        {activeTab === 'all' && isSuperAdmin && (
          <AllComplaintsTab
            token={token} onNavigate={onNavigate}
            onAssign={setAssignTarget} onResolve={setResolveTarget}
          />
        )}
        {activeTab === 'assigned' && (
          <MyAssignedTab
            token={token} onNavigate={onNavigate}
            onAssign={setAssignTarget} onResolve={setResolveTarget}
          />
        )}
      </div>

      {/* Modals */}
      {assignTarget && (
        <AssignModal
          complaint={assignTarget} token={token}
          onClose={() => setAssignTarget(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
      {resolveTarget && (
        <ResolveModal
          complaint={resolveTarget} token={token}
          onClose={() => setResolveTarget(null)}
          onSuccess={handleResolveSuccess}
        />
      )}
    </div>
  );
};

export default AdminDashboard;