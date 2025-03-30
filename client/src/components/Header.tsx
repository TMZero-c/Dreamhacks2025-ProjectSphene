import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { User } from '../types/types';

interface HeaderProps {
    title: string;
    loading: boolean;
    user: User | null;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, loading, user, onLogout }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    const handleLogout = () => {
        setShowDropdown(false);
        onLogout();
    };

    return (
        <header className="header">
            <div className="header-content">
                <h1 className="header-title">{title}</h1>
                {loading && (
                    <div className="processing-indicator">
                        Processing...
                    </div>
                )}
                <div className="user-menu" ref={dropdownRef}>
                    <button className="user-button" onClick={toggleDropdown}>
                        {user ? user.name : 'User'}
                    </button>
                    {showDropdown && (
                        <div className="user-dropdown">
                            {user ? (
                                <>
                                    <div className="user-info">
                                        <div className="user-name">{user.name}</div>
                                        <div className="user-email">{user.email}</div>
                                    </div>
                                    <button className="logout-button" onClick={handleLogout}>
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <div className="user-info">Not logged in</div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
