// src/services/api.js
import { API_BASE_URL } from '../utils/constants';

const apiFetch = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Something went wrong');
  return data;
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) =>
    apiFetch(`${API_BASE_URL}/auth/login`, { method: 'POST', body: JSON.stringify(credentials) }),

  register: (userData) =>
    apiFetch(`${API_BASE_URL}/auth/register`, { method: 'POST', body: JSON.stringify(userData) }),
};

// ── COMPLAINTS ────────────────────────────────────────────────────────────────
export const complaintsAPI = {

  /** All complaints — admin gets all, student gets own */
  getAll: (token, filters = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    return apiFetch(`${API_BASE_URL}/complaints${q ? `?${q}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Complaints assigned to the logged-in admin only */
  getMyAssigned: (token, filters = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    return apiFetch(`${API_BASE_URL}/complaints/my-assigned${q ? `?${q}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /** Single complaint by id */
  getById: (token, id) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** Create complaint (multipart/form-data) */
  create: (token, formData) =>
    fetch(`${API_BASE_URL}/complaints`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Something went wrong');
      return d;
    }),

  /** Full status + priority update */
  updateStatus: (token, id, statusData) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify(statusData),
    }),

  /** Assign (or re-assign) to an admin */
  assign: (token, id, assignData) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/assign`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify(assignData),
    }),

  /** Quick resolve with optional comment */
  resolve: (token, id, comment = '') =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/resolve`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ comment }),
    }),

  /** Reject a complaint with a mandatory reason */
  reject: (token, id, reason) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/reject`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ reason }),
    }),

  /** Admin asks student for more information */
  requestMoreInfo: (token, id, question) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/request-info`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ question }),
    }),

  /**
   * Student submits additional info with optional file attachments.
   * Caller must pass a FormData object that includes 'response' text
   * and optionally 'attachments' files.
   */
  submitAdditionalInfo: (token, id, formData) =>
    fetch(`${API_BASE_URL}/complaints/${id}/submit-info`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    formData,
    }).then(async r => {
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || 'Something went wrong');
      return d;
    }),

  /** Admin sends a reply visible to the student */
  addReply: (token, id, message) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/reply`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify({ message }),
    }),

  /** List of all admin/superadmin users for assign dropdown */
  getAdmins: (token) =>
    apiFetch(`${API_BASE_URL}/complaints/admins`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** Student feedback on a resolved complaint */
  addFeedback: (token, id, feedbackData) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/feedback`, {
      method:  'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body:    JSON.stringify(feedbackData),
    }),

  /** Delete (admin only) */
  delete: (token, id) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      method:  'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};