import api from './api';

export interface TeamMember {
  _id: string; // Mongo ID
  name: string;
  email: string;
  role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
  status: 'Active' | 'Pending';
  avatar?: string;
  joinedAt: string;
}

export const getMembers = async (): Promise<TeamMember[]> => {
  try {
    const { data } = await api.get('/team');
    return data;
  } catch (error) {
    console.error('API getMembers failed', error);
    return [];
  }
};

export const inviteMember = async (email: string, role: string): Promise<TeamMember> => {
  try {
    const { data } = await api.post('/team/invite', { email, role });
    return data;
  } catch (error) {
    console.error('API inviteMember failed', error);
    throw error;
  }
};

export const updateMemberRole = async (id: string, role: string): Promise<TeamMember> => {
  try {
    const { data } = await api.put(`/team/${id}/role`, { role });
    return data;
  } catch (error) {
    console.error('API updateMemberRole failed', error);
    throw error;
  }
};

export const removeMember = async (id: string): Promise<void> => {
  try {
    await api.delete(`/team/${id}`);
  } catch (error) {
    console.error('API removeMember failed', error);
    throw error;
  }
};
