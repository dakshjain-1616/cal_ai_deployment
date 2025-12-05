import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, TrendingUp, Droplet, Dumbbell, History, Settings } from 'lucide-react';

const Navigation = ({ darkMode }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/scan', icon: Camera, label: 'Scan' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/water', icon: Droplet, label: 'Water' },
    { path: '/exercise', icon: Dumbbell, label: 'Exercise' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: darkMode ? 'rgba(26, 26, 26, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(24, 24, 24, 0.1)'}`,
      padding: '8px 0',
      zIndex: 1000,
      boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '0 16px'
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textDecoration: 'none',
                color: isActive ? 'rgb(0, 128, 255)' : darkMode ? 'rgb(160, 160, 160)' : 'rgb(112, 112, 112)',
                transition: 'all 0.2s ease',
                padding: '8px 12px',
                borderRadius: '8px',
                minWidth: '60px'
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span style={{
                fontSize: '11px',
                marginTop: '4px',
                fontWeight: isActive ? 600 : 500
              }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
