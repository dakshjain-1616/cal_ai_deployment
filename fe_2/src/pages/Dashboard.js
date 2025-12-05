import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, TrendingUp, Droplet, Dumbbell, Target, Flame } from 'lucide-react';
import { getMeals, getWaterLogs, getExercises, getDailySummary } from '../services/api';
import { calculateDailyCalories } from '../utils/calculations';

const Dashboard = ({ profile }) => {
  const navigate = useNavigate();
  const [todayMeals, setTodayMeals] = useState([]);
  const [todayWater, setTodayWater] = useState(0);
  const [todayExercise, setTodayExercise] = useState(0);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileDailyTarget = profile?.dailyCalorieTarget ?? 0;
  const estimatedDailyCalories = calculateDailyCalories(profile);
  const dailyCalories =
    profileDailyTarget > 0 ? profileDailyTarget : estimatedDailyCalories || 2000;

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [meals, waterLogs, exercises, summary] = await Promise.all([
        getMeals(today),
        getWaterLogs(today),
        getExercises(today),
        getDailySummary(today).catch(() => null)
      ]);

      setTodayMeals(meals);
      setDailySummary(summary);
      
      const totalWater = waterLogs.reduce((sum, log) => sum + log.amount, 0);
      setTodayWater(totalWater);

      const totalCaloriesBurned = exercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
      setTodayExercise(totalCaloriesBurned);
    } catch (error) {
      console.error('Error loading today data:', error);
    } finally {
      setLoading(false);
    }
  };

  const summaryCaloriesConsumed = dailySummary?.totalCalories ?? null;
  const consumedCalories =
    summaryCaloriesConsumed !== null
      ? summaryCaloriesConsumed
      : todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const netCalories = consumedCalories - todayExercise;
  const remainingCalories =
    dailySummary?.remainingCalories !== undefined
      ? dailySummary.remainingCalories
      : dailyCalories - netCalories;
  const progressPercent =
    dailyCalories > 0 ? Math.min((netCalories / dailyCalories) * 100, 100) : 0;

  const consumedProtein =
    dailySummary?.totalMacros?.protein ?? todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const consumedCarbs =
    dailySummary?.totalMacros?.carbs ?? todayMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const consumedFat =
    dailySummary?.totalMacros?.fat ?? todayMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  const quickActions = [
    { icon: Camera, label: 'Scan Food', path: '/scan', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { icon: Droplet, label: 'Log Water', path: '/water', gradient: 'linear-gradient(135deg, #06beb6 0%, #48b1bf 100%)' },
    { icon: Dumbbell, label: 'Log Exercise', path: '/exercise', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { icon: TrendingUp, label: 'View Progress', path: '/progress', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }
  ];

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
    <div style={{ padding: '24px 16px', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-page)' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 className="heading-2" style={{ marginBottom: '8px' }}>Welcome back, {profile.name || 'User'}!</h1>
        <p className="body-small">Track your nutrition and reach your goals</p>
      </div>

      {/* Calorie Progress Card */}
      <div className="service-card" style={{ marginBottom: '24px', background: 'var(--gradient-hero)', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <p className="caption" style={{ marginBottom: '8px' }}>Daily Goal</p>
            <h2 className="heading-3">{dailyCalories} cal</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Flame size={32} color="#ff6b6b" />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span className="body-small">Progress</span>
            <span className="body-small" style={{ fontWeight: 600 }}>
              {netCalories} / {dailyCalories} cal
            </span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            background: 'rgba(255, 255, 255, 0.3)', 
            borderRadius: '100px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: progressPercent > 100 ? '#ff6b6b' : 'var(--gradient-button)',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div>
            <p className="caption">Remaining</p>
            <p className="body-medium" style={{ fontWeight: 600, color: remainingCalories >= 0 ? '#10b981' : '#ff6b6b' }}>
              {remainingCalories >= 0 ? remainingCalories : 0} cal
            </p>
          </div>
          <div>
            <p className="caption">Consumed</p>
            <p className="body-medium" style={{ fontWeight: 600 }}>{consumedCalories} cal</p>
          </div>
          <div>
            <p className="caption">Burned</p>
            <p className="body-medium" style={{ fontWeight: 600 }}>{todayExercise} cal</p>
          </div>
        </div>
      </div>

      {/* Macros Summary */}
      <div className="service-card" style={{ marginBottom: '24px' }}>
        <h3 className="heading-4" style={{ marginBottom: '16px' }}>Today's Macros</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#3b82f6' }}>{consumedProtein}g</span>
            </div>
            <p className="caption">Protein</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#f59e0b' }}>{consumedCarbs}g</span>
            </div>
            <p className="caption">Carbs</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 8px'
            }}>
              <span style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{consumedFat}g</span>
            </div>
            <p className="caption">Fat</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '24px' }}>
        <h3 className="heading-4" style={{ marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                style={{
                  background: action.gradient,
                  border: 'none',
                  borderRadius: '16px',
                  padding: '20px',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  minHeight: '100px',
                  transition: 'transform 0.2s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <Icon size={32} strokeWidth={2} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Meals */}
      {todayMeals.length > 0 && (
        <div className="service-card">
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Recent Meals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todayMeals.slice(-3).reverse().map((meal, index) => {
              const primaryFood =
                meal.foods && meal.foods.length > 0
                  ? meal.foods
                      .slice(0, 2)
                      .map((food) => food.name)
                      .join(', ')
                  : meal.originalInput || 'Meal';
              return (
                <div
                  key={index}
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
                    <p className="body-medium" style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {primaryFood}
                    </p>
                    <p className="caption">
                      {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p className="body-medium" style={{ fontWeight: 600 }}>
                      {meal.calories} cal
                    </p>
                    <p className="caption">
                      {meal.protein}g P | {meal.carbs}g C | {meal.fat}g F
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
