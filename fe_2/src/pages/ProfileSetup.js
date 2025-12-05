import React, { useState, useEffect } from 'react';
import { User, TrendingDown, TrendingUp, Target } from 'lucide-react';
import { getUserProfile, updateUserProfile } from '../services/api';
import { calculateDailyCalories } from '../utils/calculations';

const resolveTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (error) {
    return 'UTC';
  }
};

const buildInitialForm = (existingProfile) => ({
  name: existingProfile?.name ?? '',
  age: existingProfile?.age ?? '',
  gender: existingProfile?.gender ?? 'male',
  height: existingProfile?.height ?? '',
  weight: existingProfile?.weight ?? '',
  goalWeight: existingProfile?.goalWeight ?? '',
  activityLevel: existingProfile?.activityLevel ?? 'moderate',
  goal: existingProfile?.goal ?? 'maintain',
  timezone: existingProfile?.timezone ?? resolveTimezone(),
});

const ProfileSetup = ({ profile, setProfile }) => {
  const [formData, setFormData] = useState(() => buildInitialForm(profile));
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(!profile);
  const [error, setError] = useState('');
  const [serverDailyTarget, setServerDailyTarget] = useState(
    profile?.dailyCalorieTarget ?? null
  );

  useEffect(() => {
    setFormData(buildInitialForm(profile));
    if (profile?.dailyCalorieTarget) {
      setServerDailyTarget(profile.dailyCalorieTarget);
    }
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setLoadingProfile(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      try {
        setLoadingProfile(true);
        const serverProfile = await getUserProfile();
        if (!isMounted || !serverProfile) {
          return;
        }

        if (serverProfile.dailyCalorieTarget !== undefined) {
          setServerDailyTarget(serverProfile.dailyCalorieTarget);
        }

        setFormData((current) => ({
          ...current,
          timezone: serverProfile.timezone || current.timezone,
        }));
      } catch (err) {
        console.error('Unable to load profile from backend', err);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [profile]);

  const normalizedForCalculation = {
    ...formData,
    age: formData.age ? Number(formData.age) : undefined,
    height: formData.height ? Number(formData.height) : undefined,
    weight: formData.weight ? Number(formData.weight) : undefined,
    goalWeight: formData.goalWeight ? Number(formData.goalWeight) : undefined,
  };

  const dailyCalories = calculateDailyCalories(normalizedForCalculation);
  const effectiveDailyTarget =
    (dailyCalories && dailyCalories > 0 ? dailyCalories : serverDailyTarget) ?? 2000;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleGoalChange = (goalValue) => {
    setFormData((current) => ({
      ...current,
      goal: goalValue,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const normalized = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        goalWeight: formData.goalWeight ? Number(formData.goalWeight) : undefined,
      };

      const calculatedCalories = calculateDailyCalories(normalized);
      const desiredDailyTarget =
        (calculatedCalories && calculatedCalories > 0
          ? calculatedCalories
          : serverDailyTarget) ?? 2000;
      const timezone = formData.timezone || resolveTimezone();

      const updatedProfile = await updateUserProfile({
        dailyCalorieTarget: desiredDailyTarget,
        timezone,
      });

      const nextProfile = {
        ...formData,
        age: normalized.age,
        height: normalized.height,
        weight: normalized.weight,
        goalWeight: normalized.goalWeight,
        dailyCalorieTarget: updatedProfile.dailyCalorieTarget,
        dailyCalories: calculatedCalories || updatedProfile.dailyCalorieTarget,
        timezone: updatedProfile.timezone,
      };

      localStorage.setItem('userProfile', JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setServerDailyTarget(updatedProfile.dailyCalorieTarget);

      if (!profile) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Error saving profile', err);
      setError('Error saving profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderGoalButton = (value, label, Icon) => (
    <button
      type="button"
      onClick={() => handleGoalChange(value)}
      style={{
        padding: '16px',
        borderRadius: '12px',
        border:
          formData.goal === value
            ? '2px solid var(--brand-primary)'
            : '1px solid var(--border-medium)',
        background:
          formData.goal === value ? 'rgba(0, 128, 255, 0.1)' : 'var(--bg-card)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'transform 0.2s ease',
      }}
      disabled={loading || loadingProfile}
    >
      <Icon
        size={24}
        color={formData.goal === value ? 'rgb(0, 128, 255)' : 'var(--text-secondary)'}
      />
      <span className="body-small" style={{ fontWeight: 600 }}>
        {label}
      </span>
    </button>
  );

  return (
    <div
      style={{
        minHeight: '100vh',
        background: profile ? 'var(--bg-page)' : 'var(--gradient-hero)',
        padding: '24px 16px',
        paddingBottom: profile ? '100px' : '24px',
      }}
    >
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--gradient-button)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <User size={40} color="white" />
          </div>
          <h1 className="heading-2" style={{ marginBottom: '8px' }}>
            {profile ? 'Edit Profile' : 'Set Up Your Profile'}
          </h1>
          <p className="body-medium">Help us calculate your daily calorie needs</p>
        </div>

        {loadingProfile && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'var(--bg-section)',
              marginBottom: '24px',
              textAlign: 'center',
            }}
          >
            <p className="body-small">Loading your CalAI profile...</p>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              marginBottom: '24px',
            }}
          >
            <p className="body-small" style={{ color: '#ef4444' }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="service-card" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label>Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              disabled={loading || loadingProfile}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div>
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="25"
                min="1"
                max="120"
                required
                disabled={loading || loadingProfile}
              />
            </div>
            <div>
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                disabled={loading || loadingProfile}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div>
              <label>Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="170"
                min="1"
                step="0.1"
                required
                disabled={loading || loadingProfile}
              />
            </div>
            <div>
              <label>Current Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="70"
                min="1"
                step="0.1"
                required
                disabled={loading || loadingProfile}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label>Goal Weight (kg)</label>
            <input
              type="number"
              name="goalWeight"
              value={formData.goalWeight}
              onChange={handleChange}
              placeholder="65"
              min="1"
              step="0.1"
              required
              disabled={loading || loadingProfile}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label>Activity Level</label>
            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              required
              disabled={loading || loadingProfile}
            >
              <option value="sedentary">Sedentary (little or no exercise)</option>
              <option value="light">Light (exercise 1-3 days/week)</option>
              <option value="moderate">Moderate (exercise 3-5 days/week)</option>
              <option value="active">Active (exercise 6-7 days/week)</option>
              <option value="very_active">Very Active (intense exercise daily)</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label>Time Zone</label>
            <input
              type="text"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              placeholder="e.g., Asia/Kolkata"
              required
              disabled={loading || loadingProfile}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label>Goal</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {renderGoalButton('lose', 'Lose Weight', TrendingDown)}
              {renderGoalButton('maintain', 'Maintain', Target)}
              {renderGoalButton('gain', 'Gain Weight', TrendingUp)}
            </div>
          </div>

          {effectiveDailyTarget > 0 && (
            <div
              style={{
                padding: '16px',
                background: 'var(--bg-section)',
                borderRadius: '12px',
                marginBottom: '24px',
                textAlign: 'center',
              }}
            >
              <p className="caption" style={{ marginBottom: '4px' }}>
                Your Daily Calorie Goal
              </p>
              <p className="heading-3" style={{ color: 'var(--brand-primary)' }}>
                {effectiveDailyTarget} cal
              </p>
              {dailyCalories > 0 && (
                <p className="caption">Based on your profile inputs</p>
              )}
              {dailyCalories <= 0 && serverDailyTarget && (
                <p className="caption">Using previously saved target</p>
              )}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || loadingProfile}
            style={{ width: '100%' }}
          >
            {loading ? 'Saving...' : profile ? 'Update Profile' : 'Start Tracking'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetup;
