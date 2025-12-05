import React, { useState, useEffect } from 'react';
import { Calendar, Trash2, UtensilsCrossed } from 'lucide-react';
import { getMeals, deleteMeal } from '../services/api';

const MealHistory = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadMeals();
  }, [selectedDate]);

  const loadMeals = async () => {
    try {
      const data = await getMeals(selectedDate);
      setMeals(data);
    } catch (error) {
      console.error('Error loading meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mealId) => {
    if (window.confirm('Are you sure you want to delete this meal?')) {
      try {
        await deleteMeal(mealId);
        await loadMeals();
      } catch (error) {
        console.error('Error deleting meal:', error);
      }
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.totalCalories || meal.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.totalMacros?.protein || meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.totalMacros?.carbs || meal.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.totalMacros?.fat || meal.fat || 0), 0);

  // Group meals by date
  const groupedMeals = meals.reduce((acc, meal) => {
    const date = new Date(meal.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(meal);
    return acc;
  }, {});

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
        <h1 className="heading-2" style={{ marginBottom: '8px' }}>Meal History</h1>
        <p className="body-medium" style={{ marginBottom: '32px' }}>Review your nutrition log</p>

        {/* Summary Card */}
        {meals.length > 0 && (
          <div className="service-card" style={{ marginBottom: '24px', background: 'var(--gradient-hero)', border: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <Calendar size={28} />
              <div>
                <p className="caption">Total Today</p>
                <p className="heading-4">{totalCalories} calories</p>
              </div>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '12px',
              padding: '16px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '12px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <p className="caption" style={{ marginBottom: '4px' }}>Protein</p>
                <p className="body-medium" style={{ fontWeight: 600, color: '#3b82f6' }}>{totalProtein}g</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="caption" style={{ marginBottom: '4px' }}>Carbs</p>
                <p className="body-medium" style={{ fontWeight: 600, color: '#f59e0b' }}>{totalCarbs}g</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p className="caption" style={{ marginBottom: '4px' }}>Fat</p>
                <p className="body-medium" style={{ fontWeight: 600, color: '#ef4444' }}>{totalFat}g</p>
              </div>
            </div>
          </div>
        )}

        {/* Meals List */}
        {Object.keys(groupedMeals).length > 0 ? (
          <div className="service-card">
            <h3 className="heading-4" style={{ marginBottom: '16px' }}>All Meals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Object.entries(groupedMeals).map(([date, dateMeals]) => (
                <div key={date}>
                  <p className="body-small" style={{ 
                    fontWeight: 600, 
                    marginBottom: '12px',
                    color: 'var(--text-secondary)'
                  }}>
                    {date}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {dateMeals.map((meal) => (
                      <div 
                        key={meal.id}
                        style={{
                          padding: '16px',
                          background: 'var(--bg-section)',
                          borderRadius: '12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <p className="body-medium" style={{ fontWeight: 600, marginBottom: '4px' }}>
                            {meal.foods && meal.foods.length > 0
                              ? meal.foods
                                  .slice(0, 2)
                                  .map((food) => food.name)
                                  .join(', ')
                              : meal.originalInput || 'Meal'}
                          </p>
                          <p className="caption" style={{ marginBottom: '8px' }}>
                            {new Date(meal.timestamp).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '12px',
                            marginTop: '8px'
                          }}>
                            <div
                              style={{
                                padding: '4px 12px',
                                background: 'rgba(0, 0, 0, 0.05)',
                                borderRadius: '100px'
                              }}
                            >
                              <span className="caption" style={{ fontWeight: 600 }}>
                                {(meal.totalCalories ?? meal.calories ?? 0)} cal
                              </span>
                            </div>
                            <div
                              style={{
                                padding: '4px 12px',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '100px'
                              }}
                            >
                              <span className="caption" style={{ fontWeight: 600, color: '#3b82f6' }}>
                                {(meal.totalMacros?.protein ?? meal.protein ?? 0)}g P
                              </span>
                            </div>
                            <div
                              style={{
                                padding: '4px 12px',
                                background: 'rgba(245, 158, 11, 0.1)',
                                borderRadius: '100px'
                              }}
                            >
                              <span className="caption" style={{ fontWeight: 600, color: '#f59e0b' }}>
                                {(meal.totalMacros?.carbs ?? meal.carbs ?? 0)}g C
                              </span>
                            </div>
                            <div
                              style={{
                                padding: '4px 12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '100px'
                              }}
                            >
                              <span className="caption" style={{ fontWeight: 600, color: '#ef4444' }}>
                                {(meal.totalMacros?.fat ?? meal.fat ?? 0)}g F
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(meal.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '8px',
                            borderRadius: '8px'
                          }}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-section)',
            borderRadius: '12px'
          }}>
            <UtensilsCrossed size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <p className="body-medium" style={{ color: 'var(--text-secondary)' }}>No meals logged yet</p>
            <p className="caption">Start tracking your nutrition!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealHistory;
