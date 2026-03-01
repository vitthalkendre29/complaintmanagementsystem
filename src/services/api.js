// src/services/api.js
import { API_BASE_URL } from '../utils/constants';

/**
 * Base fetch wrapper with error handling
 */
const apiFetch = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  login: async (credentials) => {
    return apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register: async (userData) => {
    return apiFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// ==================== COMPLAINTS API ====================
export const complaintsAPI = {
  getAll: async (token, filters = {}) => {
    const queryParams = new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v)
    ).toString();

    return apiFetch(
      `${API_BASE_URL}/complaints${queryParams ? `?${queryParams}` : ''}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
  },

  getById: async (token, id) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  create: async (token, complaintData) => {
    return fetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: complaintData,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');
      return data;
    });
  },

  updateStatus: async (token, id, statusData) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(statusData),
    });
  },

  /**
   * Assign complaint to an admin with optional note
   */
  assign: async (token, id, assignData) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(assignData),
    });
  },

  /**
   * Get list of all admin users (for the assign dropdown)
   */
  getAdmins: async (token) => {
    return apiFetch(`${API_BASE_URL}/complaints/admins`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Admin adds a reply/message to a complaint (visible to student)
   */
  addReply: async (token, id, message) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}/reply`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });
  },

  addFeedback: async (token, id, feedbackData) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}/feedback`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(feedbackData),
    });
  },

  delete: async (token, id) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};