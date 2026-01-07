import axios from 'axios';

type UnknownRecord = Record<string, unknown>;

export function safeObject(value: unknown): UnknownRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as UnknownRecord;
  }
  return {};
}

export function safeArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}
import { validateAndCorrectPath } from '../utils/apiValidator';
import { addRetryInterceptor } from '../utils/retryInterceptor';
import { addDeduplicationInterceptor } from '../utils/requestCache';
import { devLogger } from '../utils/devLogger';

// Create Axios instance with base URL from environment variables
const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 second timeout to prevent silent hangs
});

// Request interceptor for adding auth token and validating paths
api.interceptors.request.use(
  (config) => {
    // Validate and auto-correct API path
    if (config.url) {
      config.url = validateAndCorrectPath(config.url);
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add admin key for backend authentication
    config.headers['x-admin-key'] = 'Threem123';

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for global error handling (optional, but good practice)
api.interceptors.response.use(
  (response) => {
    if (response.data == null) {
      response.data = {};
    }
    return response;
  },
  (error) => {
    // Log API errors
    if (error.config && !error.__CANCEL__) {
      devLogger.apiError(error.config.url, error);
    }

    // Handle unauthorized access (redirect to login), but skip for login endpoint itself
    // to allow the LoginScreen to handle "Invalid credentials" errors gracefully.
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config.url?.includes('/auth/login')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Add retry logic with exponential backoff
addRetryInterceptor(api, {
  maxRetries: 3,
  retryDelay: 1000,
});

// Add request deduplication to prevent duplicate calls
addDeduplicationInterceptor(api);


import { AuditLogResponse, AuditLogFilters } from '../types/audit';

export async function getAuditLogs(filters: AuditLogFilters = {}): Promise<AuditLogResponse> {
  const { limit = 50, offset = 0 } = filters;
  const response = await api.get('/audit-logs', { params: { limit, offset } });
  return response.data;
}

export default api;
