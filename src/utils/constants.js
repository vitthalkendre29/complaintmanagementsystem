// src/utils/constants.js

// API Base URL
export const API_BASE_URL = 'https://testing-backend-neon.vercel.app/api';

// User Roles
export const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  SUPERADMIN: 'superadmin'
};

// Complaint Status
export const COMPLAINT_STATUS = {
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  ESCALATED: 'Escalated'
};

// Complaint Categories
export const CATEGORIES = [
  'Infrastructure',
  'Cafeteria',
  'Library',
  'Transportation',
  'Academic',
  'Hostel',
  'Administrative',
  'Other'
];

// Priority Levels
export const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical'
};

// Status Colors for UI
export const STATUS_COLORS = {
  Open: 'bg-blue-100 text-blue-800',
  'In Progress': 'bg-yellow-100 text-yellow-800',
  Resolved: 'bg-green-100 text-green-800',
  Closed: 'bg-gray-100 text-gray-800',
  Escalated: 'bg-red-100 text-red-800'
};

// Priority Colors
export const PRIORITY_COLORS = {
  Low: 'bg-gray-100 text-gray-700',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Critical: 'bg-red-100 text-red-700'
};