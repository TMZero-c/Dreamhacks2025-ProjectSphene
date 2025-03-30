import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AuthUser, getCurrentUser, isAuthenticated, getUser, logout } from '../services/authService';

interface AuthContextType {
    isAuthenticated: boolean;
    user: AuthUser | null;
    loading: boolean;
    error: string | null;
    login: (user: AuthUser) => void;
    logout: () => Promise<void>;
    checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    user: null,
    loading: true,
    error: null,
    login: () => { },
    logout: async () => { },
    checkAuth: async () => false
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: false,
        user: null as AuthUser | null,
        loading: true,
        error: null as string | null
    });

    // Initialize auth state on component mount
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                setAuthState(prev => ({ ...prev, loading: true }));

                // If we're in development mode with a dev user, use that
                if (process.env.NODE_ENV === 'development' && localStorage.getItem('dev_user_id')) {
                    const devUserId = localStorage.getItem('dev_user_id');
                    const user = {
                        id: devUserId || 'user1',
                        name: `Dev User ${devUserId}`,
                        email: `${devUserId}@example.com`,
                        roles: ['user'],
                        isVerified: true
                    };

                    setAuthState({
                        isAuthenticated: true,
                        user,
                        loading: false,
                        error: null
                    });
                    return;
                }

                // Otherwise, check real authentication
                await checkAuth();
            } catch (err) {
                console.error('Authentication initialization failed:', err);
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: 'Authentication failed. Please log in again.'
                });
            }
        };

        initializeAuth();
    }, []);

    const checkAuth = async (): Promise<boolean> => {
        try {
            if (!isAuthenticated()) {
                setAuthState(prev => ({
                    ...prev,
                    isAuthenticated: false,
                    user: null,
                    loading: false
                }));
                return false;
            }

            const userFromStorage = getUser();

            // Verify with server (only if we have a token)
            try {
                const user = await getCurrentUser();
                setAuthState({
                    isAuthenticated: true,
                    user,
                    loading: false,
                    error: null
                });
                return true;
            } catch (err) {
                console.error('Authentication check failed:', err);
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                    loading: false,
                    error: null
                });
                return false;
            }
        } catch (err) {
            console.error('Authentication check failed:', err);
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
            return false;
        }
    };

    const login = (user: AuthUser) => {
        setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
            error: null
        });
    };

    const handleLogout = async () => {
        try {
            await logout();
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: null
            });
        } catch (err) {
            console.error('Logout failed:', err);
            // Still update state even if server logout fails
            setAuthState({
                isAuthenticated: false,
                user: null,
                loading: false,
                error: 'Logout failed, but local session has been cleared.'
            });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated: authState.isAuthenticated,
                user: authState.user,
                loading: authState.loading,
                error: authState.error,
                login,
                logout: handleLogout,
                checkAuth
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
