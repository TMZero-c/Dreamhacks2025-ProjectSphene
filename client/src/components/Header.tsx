import React from 'react';
import './Header.css';

interface HeaderProps {
    title: string;
    loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, loading }) => {
    return (
        <header className="header">
            <div className="header-content">
                <h1 className="header-title">{title}</h1>
                {loading && (
                    <div className="processing-indicator">
                        Processing...
                    </div>
                )}
                <button className="user-button">
                    User
                </button>
            </div>
        </header>
    );
};

export default Header;
