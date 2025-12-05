import React, { useState, useEffect } from 'react';
import { Droplet, Plus } from 'lucide-react';
import { getWaterLogs, logWater } from '../services/api';

const WaterTracker = () => {
  const [waterLogs, setWaterLogs] = useState([]);
  const [totalWater, setTotalWater] = useState(0);
  const [loading, setLoading] = useState(true);
  const dailyGoal = 2000; // 2000ml = 2 liters

  const quickAmounts = [250, 500, 750, 1000];

  useEffect(() => {
    loadTodayWater();
  }, []);

  const loadTodayWater = async () => {
    try {
      const today = new Date();
      const logs = await getWaterLogs(today);
      setWaterLogs(logs);
      const total = logs.reduce((sum, log) => sum + log.amount, 0);
      setTotalWater(total);
    } catch (error) {
      console.error('Error loading water logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const addWater = async (amount) => {
    try {
      await logWater(amount, new Date());
      await loadTodayWater();
    } catch (error) {
      console.error('Error logging water:', error);
    }
  };

  const progressPercent = Math.min((totalWater / dailyGoal) * 100, 100);
  const remainingWater = Math.max(dailyGoal - totalWater, 0);

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
        <h1 className="heading-2" style={{ marginBottom: '8px' }}>Water Tracker</h1>
        <p className="body-medium" style={{ marginBottom: '32px' }}>Stay hydrated throughout the day</p>

        {/* Water Progress */}
        <div className="service-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)', border: 'none', color: 'white' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Droplet size={64} style={{ margin: '0 auto 16px', opacity: 0.9 }} />
            <h2 className="heading-1" style={{ color: 'white' }}>{totalWater} ml</h2>
            <p style={{ fontSize: '14px', opacity: 0.9, marginTop: '8px' }}>of {dailyGoal} ml daily goal</p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              width: '100%', 
              height: '12px', 
              background: 'rgba(255, 255, 255, 0.3)', 
              borderRadius: '100px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: 'white',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '16px', fontWeight: 600 }}>
              {progressPercent >= 100 ? '🎉 Goal Achieved!' : `${remainingWater} ml remaining`}
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="service-card" style={{ marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Quick Add</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => addWater(amount)}
                style={{
                  padding: '20px',
                  border: '2px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.95)';
                  e.currentTarget.style.background = 'var(--bg-section)';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                <Plus size={24} color="var(--brand-primary)" />
                <span className="body-medium" style={{ fontWeight: 600 }}>{amount} ml</span>
                <span className="caption">{amount === 250 ? 'Cup' : amount === 500 ? 'Bottle' : amount === 750 ? 'Large Bottle' : 'XL Bottle'}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Logs */}
        {waterLogs.length > 0 && (
          <div className="service-card">
            <h3 className="heading-4" style={{ marginBottom: '16px' }}>Today's Intake</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {waterLogs.slice().reverse().map((log) => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Droplet size={20} color="#06beb6" />
                    <div>
                      <p className="body-medium" style={{ fontWeight: 600 }}>{log.amount} ml</p>
                      <p className="caption">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'rgba(6, 190, 182, 0.1)',
          border: '1px solid rgba(6, 190, 182, 0.3)',
          borderRadius: '12px'
        }}>
          <p className="body-small" style={{ fontWeight: 600, marginBottom: '8px' }}>💡 Hydration Tips</p>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            <li className="caption" style={{ marginBottom: '4px' }}>Drink water regularly throughout the day</li>
            <li className="caption" style={{ marginBottom: '4px' }}>Increase intake during exercise</li>
            <li className="caption">Listen to your body's thirst signals</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WaterTracker;
