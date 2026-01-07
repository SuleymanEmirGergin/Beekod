export interface User {
    id: number;
    email: string;
    name: string;
    role: 'Owner' | 'Admin' | 'Member' | 'Viewer';
    avatar?: string;
}

export interface LoginResponse {
    token: string;
    user: User;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
