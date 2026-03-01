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

// ==================== AUTH ====================
export const authAPI = {
  login: (credentials) =>
    apiFetch(`${API_BASE_URL}/auth/login`, { method: 'POST', body: JSON.stringify(credentials) }),

  register: (userData) =>
    apiFetch(`${API_BASE_URL}/auth/register`, { method: 'POST', body: JSON.stringify(userData) }),
};

// ==================== COMPLAINTS ====================
export const complaintsAPI = {
  getAll: (token, filters = {}) => {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
    return apiFetch(`${API_BASE_URL}/complaints${q ? `?${q}` : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getById: (token, id) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  create: (token, formData) =>
    fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Something went wrong');
      return data;
    }),

  updateStatus: (token, id, statusData) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(statusData),
    }),

  assign: (token, id, assignData) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(assignData),
    }),

  getAdmins: (token) =>
    apiFetch(`${API_BASE_URL}/complaints/admins`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  addReply: (token, id, message) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/reply`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    }),

  /** Admin rejects the complaint with a reason */
  reject: (token, id, reason) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/reject`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason }),
    }),

  /** Admin requests more information from student */
  requestMoreInfo: (token, id, question) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/request-info`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ question }),
    }),

  /** Student submits additional info (with optional file attachments) */
  submitAdditionalInfo: (token, id, formData) =>
    fetch(`${API_BASE_URL}/complaints/${id}/submit-info`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Something went wrong');
      return data;
    }),

  addFeedback: (token, id, feedbackData) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}/feedback`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(feedbackData),
    }),

  delete: (token, id) =>
    apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};