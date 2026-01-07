import api from './api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  };
}

export const login = async (data: LoginPayload): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', data);
  return response.data;
};

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export const register = async (data: RegisterPayload): Promise<AuthResponse> => {
  // Use public registration endpoint
  const response = await api.post<AuthResponse>('/auth/register-public', data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/login';
};
