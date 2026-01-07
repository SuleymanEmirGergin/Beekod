import api from './api';

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  location?: string;
  position?: string;
  bio?: string;
  joinedAt: string;
}

export const getMyProfile = async (): Promise<UserProfile> => {
  const response = await api.get('/profile/me');
  return response.data;
};

export const updateMyProfile = async (data: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put('/profile/me', data);
  return response.data;
};
