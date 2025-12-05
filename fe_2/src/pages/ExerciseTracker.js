import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, X, Trash2 } from 'lucide-react';
import { getExercises, logExercise, deleteExercise } from '../services/api';

const ExerciseTracker = () => {
  const [exercises, setExercises] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    duration: '',
    caloriesBurned: ''
  });
  const [loading, setLoading] = useState(true);

  const popularExercises = [
    { name: 'Running', calories: 300, duration: 30 },
    { name: 'Walking', calories: 150, duration: 30 },
    { name: 'Cycling', calories: 250, duration: 30 },
    { name: 'Swimming', calories: 350, duration: 30 },
    { name: 'Weightlifting', calories: 200, duration: 30 },
    { name: 'Yoga', calories: 120, duration: 30 }
  ];

  useEffect(() => {
    loadTodayExercises();
  }, []);

  const loadTodayExercises = async () => {
    try {
      const today = new Date();
      const data = await getExercises(today);
      setExercises(data);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await logExercise({
        name: formData.name,
        duration: parseInt(formData.duration, 10),
        caloriesBurned: parseInt(formData.caloriesBurned, 10),
        date: new Date()
      });
      setFormData({ name: '', duration: '', caloriesBurned: '' });
      setShowAddForm(false);
      await loadTodayExercises();
    } catch (error) {
      console.error('Error logging exercise:', error);
    }
  };

  const quickAddExercise = async (exercise) => {
    try {
      await logExercise({
        name: exercise.name,
        duration: exercise.duration,
        caloriesBurned: exercise.calories,
        date: new Date()
      });
      await loadTodayExercises();
    } catch (error) {
      console.error('Error logging exercise:', error);
    }
  };

  const handleDelete = async (exerciseId) => {
    try {
      await deleteExercise(exerciseId);
      await loadTodayExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const orderedExercises = exercises
    .slice()
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const displayExercises = orderedExercises.slice().reverse();

  const totalCaloriesBurned = orderedExercises.reduce((sum, ex) => sum + ex.caloriesBurned, 0);
  const totalDuration = orderedExercises.reduce((sum, ex) => sum + ex.duration, 0);

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
        <h1 className="heading-2" style={{ marginBottom: '8px' }}>Exercise Tracker</h1>
        <p className="body-medium" style={{ marginBottom: '32px' }}>Log your workouts and activities</p>

        {/* Summary Card */}
        <div className="service-card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', border: 'none', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <Dumbbell size={48} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Calories Burned</p>
              <p className="heading-3" style={{ color: 'white' }}>{totalCaloriesBurned}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}>Duration</p>
              <p className="heading-3" style={{ color: 'white' }}>{totalDuration} min</p>
            </div>
          </div>
        </div>

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn-primary"
          style={{ width: '100%', marginBottom: '24px' }}
        >
          {showAddForm ? <X size={20} /> : <Plus size={20} />}
          <span style={{ marginLeft: '8px' }}>
            {showAddForm ? 'Cancel' : 'Add Custom Exercise'}
          </span>
        </button>

        {/* Add Exercise Form */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="service-card" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label>Exercise Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g., Running"
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="30"
                  min="1"
                  required
                />
              </div>
              <div>
                <label>Calories Burned</label>
                <input
                  type="number"
                  name="caloriesBurned"
                  value={formData.caloriesBurned}
                  onChange={handleChange}
                  placeholder="300"
                  min="1"
                  required
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Add Exercise
            </button>
          </form>
        )}

        {/* Quick Add Exercises */}
        <div className="service-card" style={{ marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>Popular Exercises</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {popularExercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => quickAddExercise(exercise)}
                style={{
                  padding: '16px',
                  border: '2px solid var(--border-medium)',
                  borderRadius: '12px',
                  background: 'var(--bg-card)',
                  cursor: 'pointer',
                  textAlign: 'left',
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
                <p className="body-medium" style={{ fontWeight: 600, marginBottom: '4px' }}>{exercise.name}</p>
                <p className="caption">{exercise.duration} min • {exercise.calories} cal</p>
              </button>
            ))}
          </div>
        </div>

        {/* Today's Exercises */}
        {displayExercises.length > 0 && (
          <div className="service-card">
            <h3 className="heading-4" style={{ marginBottom: '16px' }}>Today's Workouts</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {displayExercises.map((exercise) => (
                <div 
                  key={exercise.id}
                  style={{
                    padding: '16px',
                    background: 'var(--bg-section)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <Dumbbell size={24} color="var(--brand-primary)" />
                    <div>
                      <p className="body-medium" style={{ fontWeight: 600, marginBottom: '4px' }}>{exercise.name}</p>
                      <p className="caption">{exercise.duration} min • {exercise.caloriesBurned} cal burned</p>
                      <p className="caption">
                        {new Date(exercise.timestamp).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(exercise.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '8px'
                    }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {displayExercises.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            background: 'var(--bg-section)',
            borderRadius: '12px'
          }}>
            <Dumbbell size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <p className="body-medium" style={{ color: 'var(--text-secondary)' }}>No exercises logged today</p>
            <p className="caption">Start tracking your workouts!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseTracker;
