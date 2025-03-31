import axios from 'axios';

// API base URL - should match your API service
const API_URL = 'http://localhost:5000/api';

// User interfaces
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    roles: string[];
    isVerified: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    token: string;
    user: AuthUser;
    message?: string;
}

// Storage keys
export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'auth_user';

// Get stored token
export const getToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

// Get stored user
export const getUser = (): AuthUser | null => {
    const userJson = localStorage.getItem(USER_KEY);
    if (!userJson) return null;

    try {
        const user = JSON.parse(userJson);
        // Convert legacy format if needed
        if (user && !user.id && user._id) {
            user.id = user._id;
        }
        return user;
    } catch (e) {
        console.error('Failed to parse user data', e);
        return null;
    }
};

// Save auth data
const saveAuthData = (token: string, user: AuthUser): void => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Clear auth data
const clearAuthData = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!getToken() && !!getUser();
};

// Register a new user
export const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, data, {
            withCredentials: true // Important for cookies
        });

        const { token, user } = response.data;
        saveAuthData(token, user);

        return response.data;
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};

// Login a user
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials, {
            withCredentials: true
        });

        const { token, user } = response.data;
        saveAuthData(token, user);

        return response.data;
    } catch (error) {
        console.error('Login error:', error);
        throw error;
    }
};

// Logout a user
export const logout = async (): Promise<void> => {
    try {
        const token = getToken();
        if (token) {
            await axios.post(
                `${API_URL}/auth/logout`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        // Always clear local data regardless of server response
        clearAuthData();

        // Clear any development user ID if it exists
        if (process.env.NODE_ENV === 'development') {
            localStorage.removeItem('dev_user_id');
        }
    }
};

// Get current user from server (verification)
export const getCurrentUser = async (): Promise<AuthUser> => {
    try {
        const token = getToken();

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });

        return response.data.user;
    } catch (error) {
        console.error('Error getting current user:', error);
        clearAuthData(); // Clear invalid auth data
        throw error;
    }
};

// Request password reset
export const requestPasswordReset = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
        return response.data;
    } catch (error) {
        console.error('Password reset request error:', error);
        throw error;
    }
};

// Reset password with token
export const resetPassword = async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
        const response = await axios.post(`${API_URL}/auth/reset-password`, { token, password });
        return response.data;
    } catch (error) {
        console.error('Password reset error:', error);
        throw error;
    }
};

// Verify email with token
export const verifyEmail = async (token: string): Promise<AuthResponse> => {
    try {
        const response = await axios.get(`${API_URL}/auth/verify/${token}`);

        if (response.data.success && response.data.token && response.data.user) {
            saveAuthData(response.data.token, response.data.user);
        }

        return response.data;
    } catch (error) {
        console.error('Email verification error:', error);
        throw error;
    }
};
