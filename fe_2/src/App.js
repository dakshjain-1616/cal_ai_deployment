import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import FoodScanner from './pages/FoodScanner';
import Progress from './pages/Progress';
import WaterTracker from './pages/WaterTracker';
import ExerciseTracker from './pages/ExerciseTracker';
import MealHistory from './pages/MealHistory';
import Settings from './pages/Settings';
import Navigation from './components/Navigation';
import { ensureSession } from './services/api';

function App() {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('userProfile');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to parse stored profile', error);
      return null;
    }
  });
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    const initialize = async () => {
      try {
        await ensureSession();
      } catch (error) {
        console.error('Failed to initialize CalAI session', error);
      } finally {
        setSessionReady(true);
      }
    };

    initialize();
  }, []);

  const toggleDarkMode = () => setDarkMode((value) => !value);

  const handleProfileUpdate = (nextProfile) => {
    setProfile(nextProfile);
    if (nextProfile) {
      localStorage.setItem('userProfile', JSON.stringify(nextProfile));
    } else {
      localStorage.removeItem('userProfile');
    }
  };

  if (!sessionReady) {
    return (
      <div className="App">
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p className="body-medium">Initializing CalAI experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`App ${darkMode ? 'dark' : ''}`}>
      <BrowserRouter>
        {profile ? (
          <>
            <Navigation darkMode={darkMode} />
            <Routes>
              <Route path="/" element={<Dashboard profile={profile} />} />
              <Route path="/profile" element={<ProfileSetup profile={profile} setProfile={handleProfileUpdate} />} />
              <Route path="/scan" element={<FoodScanner />} />
              <Route path="/progress" element={<Progress profile={profile} />} />
              <Route path="/water" element={<WaterTracker />} />
              <Route path="/exercise" element={<ExerciseTracker />} />
              <Route path="/history" element={<MealHistory />} />
              <Route
                path="/settings"
                element={<Settings darkMode={darkMode} toggleDarkMode={toggleDarkMode} setProfile={handleProfileUpdate} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/" element={<ProfileSetup profile={profile} setProfile={handleProfileUpdate} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;
