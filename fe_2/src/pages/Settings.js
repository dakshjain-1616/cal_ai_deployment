import React from 'react';
import { Moon, Sun, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Settings = ({ darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? This will clear all your data.')) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div style={{ padding: '24px 16px', paddingBottom: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="heading-2" style={{ marginBottom: '8px' }}>Settings</h1>
        <p className="body-medium" style={{ marginBottom: '32px' }}>Customize your experience</p>

        {/* Appearance */}
        <div className="service-card" style={{ marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Appearance</h3>
          <div
            onClick={toggleDarkMode}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'var(--bg-section)',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {darkMode ? <Moon size={24} /> : <Sun size={24} />}
              <div>
                <p className="body-medium" style={{ fontWeight: 600 }}>Dark Mode</p>
                <p className="caption">Switch between light and dark theme</p>
              </div>
            </div>
            <div
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '100px',
                background: darkMode ? 'var(--brand-primary)' : 'var(--border-medium)',
                position: 'relative',
                transition: 'background 0.3s ease'
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: darkMode ? '26px' : '2px',
                  transition: 'left 0.3s ease'
                }}
              />
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="service-card" style={{ marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Account</h3>
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'var(--bg-section)',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={24} />
              <div style={{ textAlign: 'left' }}>
                <p className="body-medium" style={{ fontWeight: 600 }}>Edit Profile</p>
                <p className="caption">Update your personal information</p>
              </div>
            </div>
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#ef4444'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LogOut size={24} />
              <div style={{ textAlign: 'left' }}>
                <p className="body-medium" style={{ fontWeight: 600, color: '#ef4444' }}>Log Out</p>
                <p className="caption" style={{ color: '#ef4444' }}>Clear all data and start fresh</p>
              </div>
            </div>
          </button>
        </div>

        {/* App Info */}
        <div className="service-card">
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>About</h3>
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <p className="body-medium" style={{ fontWeight: 600, marginBottom: '8px' }}>Cal AI Clone</p>
            <p className="caption">Version 1.0.0</p>
            <p className="caption" style={{ marginTop: '16px', lineHeight: 1.6 }}>
              Track your calories with AI-powered food recognition. 
              Snap a photo, get instant nutrition info, and reach your goals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
