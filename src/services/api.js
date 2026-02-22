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
  /**
   * Login user
   */
  login: async (credentials) => {
    return apiFetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  /**
   * Register new user
   */
  register: async (userData) => {
    return apiFetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
};

// ==================== COMPLAINTS API ====================
export const complaintsAPI = {
  /**
   * Get all complaints with optional filters
   */
  getAll: async (token, filters = {}) => {
    const queryParams = new URLSearchParams(
      Object.entries(filters).filter(([_, v]) => v)
    ).toString();
    
    return apiFetch(
      `${API_BASE_URL}/complaints${queryParams ? `?${queryParams}` : ''}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  /**
   * Get single complaint by ID
   */
  getById: async (token, id) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  /**
   * Create new complaint
   */
  create: async (token, complaintData) => {
    return apiFetch(`${API_BASE_URL}/complaints`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(complaintData),
    });
  },

  /**
   * Update complaint status (Admin only)
   */
  updatePriority: async (token, id, priorityData) => {
  return apiFetch(`${API_BASE_URL}/complaints/${id}/priority`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(priorityData),
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
   * Assign complaint to admin
   */
  assign: async (token, id, assignData) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(assignData),
    });
  },

  /**
   * Add feedback to resolved complaint
   */
  addFeedback: async (token, id, feedbackData) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}/feedback`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(feedbackData),
    });
  },

  /**
   * Delete complaint (Admin/SuperAdmin only)
   */
  delete: async (token, id) => {
    return apiFetch(`${API_BASE_URL}/complaints/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};