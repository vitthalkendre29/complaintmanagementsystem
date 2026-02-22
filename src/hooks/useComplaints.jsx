// src/hooks/useComplaints.jsx
import { useState, useEffect, useCallback } from 'react';
import { complaintsAPI } from '../services/api';
import { useAuth } from './useAuth';

/**
 * Custom hook for managing complaints data
 */
export const useComplaints = (filters = {}) => {
  const { token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch complaints with filters
   */
  const fetchComplaints = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await complaintsAPI.getAll(token, filters);
      setComplaints(data.complaints || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, filters]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  /**
   * Refresh complaints list
   */
  const refresh = () => {
    fetchComplaints();
  };

  return {
    complaints,
    loading,
    error,
    refresh
  };
};