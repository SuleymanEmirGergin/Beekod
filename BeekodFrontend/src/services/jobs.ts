import api from './api';

export interface Job {
    id: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    total: number;
    result?: any;
    error?: string;
    created_at: string;
    updated_at: string;
}

export const getJobs = async () => {
    const { data } = await api.get('/jobs');
    return data as Job[];
};

export const getJobById = async (id: string) => {
    const { data } = await api.get(`/jobs/${id}`);
    return data as Job;
};

export const cancelJob = async (id: string) => {
    const { data } = await api.post(`/jobs/${id}/cancel`);
    return data;
};
