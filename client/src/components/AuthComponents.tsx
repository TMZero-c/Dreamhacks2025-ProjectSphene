import React, { useState, useEffect } from 'react';
import { login, register, LoginCredentials, RegisterData, USER_KEY } from '../services/authService';

interface AuthFormProps {
    onSuccess: () => void;
}

export const LoginForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const [credentials, setCredentials] = useState<LoginCredentials>({ email: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await login(credentials);
            onSuccess();
        } catch (err: Error | unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Sign In</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={credentials.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={credentials.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                />
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
            </button>
        </form>
    );
};

export const RegisterForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const [userData, setUserData] = useState<RegisterData>({ name: '', email: '', password: '' });
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await register(userData);
            onSuccess();
        } catch (err: Error | unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            <h2>Create Account</h2>

            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={userData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
                />
                <small>Password must be at least 8 characters</small>
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>
    );
};

export const AuthContainer: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [inProgress, setInProgress] = useState(false);

    useEffect(() => {
        // Check if we're in development mode with a dev user ID
        if (process.env.NODE_ENV === 'development') {
            const devUserId = localStorage.getItem('dev_user_id');
            if (devUserId) {
                // Make this user "authenticated" for dev purposes
                const fakeUser = {
                    id: devUserId,
                    name: `Dev User ${devUserId}`,
                    email: `${devUserId}@example.com`,
                    roles: ['user'],
                    isVerified: true
                };
                // Use imported USER_KEY constant
                localStorage.setItem(USER_KEY, JSON.stringify(fakeUser));
                onSuccess();
            }
        }
    }, [onSuccess]);

    return (
        <div className="auth-container">
            <div className="auth-header">
                <h1>SPHENE</h1>
                <p>Collaborative Note-Taking Platform</p>
            </div>

            {isLogin ? (
                <>
                    <LoginForm onSuccess={onSuccess} />
                    <p className="auth-switch">
                        Don't have an account?{' '}
                        <button onClick={() => setIsLogin(false)}>Sign Up</button>
                    </p>
                </>
            ) : (
                <>
                    <RegisterForm onSuccess={onSuccess} />
                    <p className="auth-switch">
                        Already have an account?{' '}
                        <button onClick={() => setIsLogin(true)}>Sign In</button>
                    </p>
                </>
            )}

            {/* Development mode quick login */}
            {process.env.NODE_ENV === 'development' && (
                <div className="dev-login-options">
                    <h4>Development Mode</h4>
                    <div className="dev-buttons">
                        <button
                            onClick={() => {
                                localStorage.setItem('dev_user_id', 'user1');
                                onSuccess();
                            }}
                            disabled={inProgress}
                        >
                            Login as User 1
                        </button>
                        <button
                            onClick={() => {
                                localStorage.setItem('dev_user_id', 'user2');
                                onSuccess();
                            }}
                            disabled={inProgress}
                        >
                            Login as User 2
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
