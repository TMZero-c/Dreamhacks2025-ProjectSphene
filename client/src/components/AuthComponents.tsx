import React, { useState, useEffect } from 'react';
import { login, register, LoginCredentials, RegisterData, USER_KEY } from '../services/authService';

// Add interface for API error response
interface ApiError {
    message?: string;
    response?: {
        data?: {
            message?: string;
            errors?: Array<{
                param: string;
                msg: string;
            }>;
        }
    }
}

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
        } catch (err: unknown) {
            const error = err as ApiError;
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
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Clear field-specific error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }

        if (name === 'password') {
            checkPasswordStrength(value);
        } else if (name === 'passwordConfirm') {
            setPasswordConfirm(value);
        } else {
            setUserData(prev => ({ ...prev, [name]: value }));
        }
    };

    const checkPasswordStrength = (password: string) => {
        setUserData(prev => ({ ...prev, password }));

        if (password.length < 8) {
            setPasswordStrength(null);
            return;
        }

        // Check password strength
        let strength = 0;
        if (password.length >= 10) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        if (strength <= 1) setPasswordStrength('weak');
        else if (strength <= 3) setPasswordStrength('medium');
        else setPasswordStrength('strong');
    };

    const validateForm = (): boolean => {
        const errors: { [key: string]: string } = {};

        // Validate name
        if (!userData.name.trim()) {
            errors.name = 'Name is required';
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!userData.email || !emailRegex.test(userData.email)) {
            errors.email = 'Valid email is required';
        }

        // Validate password
        if (userData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        // Check password confirmation
        if (userData.password !== passwordConfirm) {
            errors.passwordConfirm = 'Passwords do not match';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Clear previous errors
        setError(null);

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            await register(userData);
            onSuccess();
        } catch (err: unknown) {
            const error = err as ApiError;

            // Handle validation errors from server
            if (error.response?.data?.errors) {
                const serverErrors = error.response.data.errors;
                const fieldErrorMap: { [key: string]: string } = {};

                serverErrors.forEach((err: { param: string; msg: string }) => {
                    fieldErrorMap[err.param] = err.msg;
                });

                setFieldErrors(fieldErrorMap);
            } else {
                setError(error.response?.data?.message || 'Registration failed. Please try again.');
            }
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
                    className={fieldErrors.name ? 'error' : ''}
                    required
                />
                {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={userData.email}
                    onChange={handleChange}
                    className={fieldErrors.email ? 'error' : ''}
                    required
                />
                {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
            </div>

            <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    id="password"
                    name="password"
                    value={userData.password}
                    onChange={handleChange}
                    className={fieldErrors.password ? 'error' : ''}
                    required
                    minLength={8}
                />
                {passwordStrength && (
                    <div className={`password-strength ${passwordStrength}`}>
                        Password strength: {passwordStrength}
                    </div>
                )}
                {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
                <small>Password must be at least 8 characters. Include uppercase, numbers, and symbols for stronger security.</small>
            </div>

            <div className="form-group">
                <label htmlFor="passwordConfirm">Confirm Password</label>
                <input
                    type="password"
                    id="passwordConfirm"
                    name="passwordConfirm"
                    value={passwordConfirm}
                    onChange={handleChange}
                    className={fieldErrors.passwordConfirm ? 'error' : ''}
                    required
                />
                {fieldErrors.passwordConfirm && (
                    <div className="field-error">{fieldErrors.passwordConfirm}</div>
                )}
            </div>

            <button
                type="submit"
                disabled={loading || passwordStrength === 'weak' || !userData.password}
                className={passwordStrength === 'strong' ? 'strong-password' : ''}
            >
                {loading ? 'Creating Account...' : 'Create Account'}
            </button>
        </form>
    );
};

export const AuthContainer: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [inProgress] = useState(false);

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
