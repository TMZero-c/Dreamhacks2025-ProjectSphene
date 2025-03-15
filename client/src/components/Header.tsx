import React from 'react';

interface HeaderProps {
    title: string;
    loading: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, loading }) => {
    return (
        <header className="app-header">
            <div className="header-content">
                <h1>{title}</h1>
                {loading && <div className="loading-indicator">Processing...</div>}
            </div>
            <div className="user-controls">
                {/* temp */}
                <button className="user-button">User</button>
            </div>
        </header>
    );
};

export default Header;
