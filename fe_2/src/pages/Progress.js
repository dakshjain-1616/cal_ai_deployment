import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Plus } from 'lucide-react';
import { getWeightLogs, logWeight } from '../services/api';
import { calculateDailyCalories } from '../utils/calculations';

const Progress = ({ profile }) => {
  const [weightLogs, setWeightLogs] = useState([]);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeightLogs();
  }, []);

  const loadWeightLogs = async () => {
    try {
      const logs = await getWeightLogs();
      setWeightLogs(logs);
    } catch (error) {
      console.error('Error loading weight logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWeight = async (e) => {
    e.preventDefault();
    if (!newWeight) return;

    try {
      await logWeight(parseFloat(newWeight), new Date());
      setNewWeight('');
      setShowAddWeight(false);
      await loadWeightLogs();
    } catch (error) {
      console.error('Error logging weight:', error);
    }
  };

  const orderedLogs = weightLogs
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const reversedLogs = orderedLogs.slice().reverse();

  const baselineWeight =
    profile?.weight ?? orderedLogs[0]?.weight ?? 0;
  const goalWeight = profile?.goalWeight ?? baselineWeight;
  const currentWeight =
    orderedLogs.length > 0 ? orderedLogs[orderedLogs.length - 1].weight : baselineWeight;

  const weightChange = currentWeight - baselineWeight;
  const progressToGoal = goalWeight - currentWeight;
  const totalGoalChange = goalWeight - baselineWeight;
  const progressPercent =
    totalGoalChange !== 0 ? ((baselineWeight - currentWeight) / totalGoalChange) * 100 : 0;

  const dailyCalories =
    profile?.dailyCalorieTarget ?? calculateDailyCalories(profile);

  if (loading) {
    return (
      <div style={{ padding: '24px', paddingBottom: '100px', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', paddingTop: '40px' }}>
          <p className="body-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 16px', paddingBottom: '100px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 className="heading-2" style={{ marginBottom: '8px' }}>Your Progress</h1>
        <p className="body-medium" style={{ marginBottom: '32px' }}>Track your journey to your goal</p>

        {/* Current Status */}
        <div className="service-card" style={{ marginBottom: '24px', background: 'var(--gradient-hero)', border: 'none' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <p className="caption" style={{ marginBottom: '8px' }}>Current Weight</p>
            <h2 className="heading-1">{currentWeight} kg</h2>
            {weightChange !== 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px' }}>
                {weightChange < 0 ? (
                  <TrendingDown size={20} color="#10b981" />
                ) : (
                  <TrendingUp size={20} color="#ef4444" />
                )}
                <span style={{ 
                  fontSize: '16px', 
                  fontWeight: 600,
                  color: weightChange < 0 ? '#10b981' : '#ef4444'
                }}>
                  {Math.abs(weightChange).toFixed(1)} kg
                </span>
              </div>
            )}
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '16px',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.5)',
            borderRadius: '12px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p className="caption" style={{ marginBottom: '4px' }}>Starting</p>
              <p className="body-medium" style={{ fontWeight: 600 }}>{profile.weight} kg</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="caption" style={{ marginBottom: '4px' }}>Goal</p>
              <p className="body-medium" style={{ fontWeight: 600 }}>{profile.goalWeight} kg</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p className="caption" style={{ marginBottom: '4px' }}>Remaining</p>
              <p className="body-medium" style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>
                {Math.abs(progressToGoal).toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="service-card" style={{ marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Goal Progress</h3>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ 
              width: '100%', 
              height: '12px', 
              background: 'var(--bg-section)', 
              borderRadius: '100px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${Math.min(Math.abs(progressPercent), 100)}%`,
                height: '100%',
                background: 'var(--gradient-button)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
          <p className="caption" style={{ textAlign: 'center' }}>
            {Math.abs(progressPercent).toFixed(0)}% Complete
          </p>
        </div>

        {/* Add Weight Button */}
        <button
          onClick={() => setShowAddWeight(!showAddWeight)}
          className="btn-primary"
          style={{ width: '100%', marginBottom: '24px' }}
        >
          {showAddWeight ? <Minus size={20} /> : <Plus size={20} />}
          <span style={{ marginLeft: '8px' }}>
            {showAddWeight ? 'Cancel' : 'Log Weight'}
          </span>
        </button>

        {/* Add Weight Form */}
        {showAddWeight && (
          <form onSubmit={handleAddWeight} className="service-card" style={{ marginBottom: '24px' }}>
            <label>New Weight (kg)</label>
            <input
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="Enter your current weight"
              step="0.1"
              min="1"
              required
              style={{ marginBottom: '16px' }}
            />
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Save Weight
            </button>
          </form>
        )}

        {/* Weight History */}
        {reversedLogs.length > 0 && (
          <div className="service-card">
            <h3 className="heading-4" style={{ marginBottom: '16px' }}>Weight History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reversedLogs.map((log, index) => {
                const previous = reversedLogs[index + 1];
                let TrendIcon = Minus;
                let trendColor = 'var(--text-muted)';

                if (previous) {
                  if (log.weight < previous.weight) {
                    TrendIcon = TrendingDown;
                    trendColor = '#10b981';
                  } else if (log.weight > previous.weight) {
                    TrendIcon = TrendingUp;
                    trendColor = '#ef4444';
                  }
                }

                return (
                  <div
                    key={log.id}
                    style={{
                      padding: '12px',
                      background: 'var(--bg-section)',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p className="body-medium" style={{ fontWeight: 600 }}>{log.weight} kg</p>
                      <p className="caption">
                        {new Date(log.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    {previous && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendIcon size={16} color={trendColor} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Calorie Info */}
        <div className="service-card" style={{ marginTop: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Nutrition Goals</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)', 
            gap: '16px'
          }}>
            <div style={{ 
              padding: '16px', 
              background: 'var(--bg-section)', 
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p className="caption" style={{ marginBottom: '4px' }}>Daily Calories</p>
              <p className="heading-4" style={{ color: 'var(--brand-primary)' }}>{dailyCalories}</p>
            </div>
            <div style={{ 
              padding: '16px', 
              background: 'var(--bg-section)', 
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <p className="caption" style={{ marginBottom: '4px' }}>Activity Level</p>
              <p className="body-medium" style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                {profile.activityLevel.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Progress;
