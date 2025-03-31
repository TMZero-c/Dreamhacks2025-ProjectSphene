import { createContext, useContext } from 'react';
import { AuthUser } from '../services/authService';

export interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    login: (user: AuthUser) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
    login: () => { },
    logout: async () => { },
    checkAuth: async () => false
});

export const useAuth = () => useContext(AuthContext);
