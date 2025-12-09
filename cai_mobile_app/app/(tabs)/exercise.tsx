import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native'
import { exerciseApi, ensureSession, pingBackend } from '@/src/services/api'

export default function ExerciseTrackerScreen() {
  const [exerciseType, setExerciseType] = useState('')
  const [duration, setDuration] = useState('')
  const [intensity, setIntensity] = useState('moderate')
  const [logging, setLogging] = useState(false)

  const exerciseTypes = [
    'Running',
    'Walking',
    'Swimming',
    'Cycling',
    'Gym',
    'Yoga',
    'Basketball',
    'Football'
  ]

  const intensities = ['light', 'moderate', 'vigorous']

  const handleLogExercise = async () => {
    if (!exerciseType || !duration || parseInt(duration) <= 0) {
      Alert.alert('❌ Invalid', 'Please fill all fields')
      return
    }

    setLogging(true)
    try {
      const up = await pingBackend()
      if (!up) {
        Alert.alert('Network error', 'Cannot reach backend. Make sure the server is running and reachable from your device.')
        setLogging(false)
        return
      }

      try {
        await ensureSession()
      } catch (se) {
        console.error('Session creation failed', se)
        Alert.alert('Auth error', 'Failed to create session. Try restarting the app.')
        setLogging(false)
        return
      }

      try {
        // Estimate calories burned if not provided. Use simple METs formula with default weight 70kg.
        const mins = parseInt(duration)
        const metMap: Record<string, number> = { light: 3.0, moderate: 6.0, vigorous: 8.0 }
        const met = metMap[intensity] || 5.0
        const weightKg = 70
        const caloriesBurned = Math.max(0, Math.round(met * weightKg * (mins / 60)))

        await exerciseApi.logExercise({
          name: exerciseType,
          duration: mins,
          caloriesBurned,
          intensity
        })
        Alert.alert('✅ Success', `Logged ${duration} minutes of ${exerciseType}`)
        setExerciseType('')
        setDuration('')
        setIntensity('moderate')
      } catch (apiErr) {
        console.error('Error logging exercise:', apiErr)
        const errAny = apiErr as any
        let msg = 'Failed to log exercise'
        if (String(errAny.message || '').includes('Network Error') || String(errAny.message || '').includes('cannot reach backend')) {
          msg = 'Network error: cannot reach backend. Ensure the server is running and reachable from your device.'
        } else if (errAny?.response?.data?.detail) {
          msg = errAny.response.data.detail
        } else if (errAny?.message) {
          msg = errAny.message
        }
        Alert.alert('❌ Error', msg)
      }
    } finally {
      setLogging(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏃 Exercise Tracker</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Type of Exercise</Text>
        <View style={styles.grid}>
          {exerciseTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                exerciseType === type && styles.typeButtonActive
              ]}
              onPress={() => setExerciseType(type)}
              disabled={logging}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  exerciseType === type && styles.typeButtonTextActive
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Duration (minutes)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter duration"
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          editable={!logging}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intensity</Text>
        <View style={styles.intensityContainer}>
          {intensities.map((int) => (
            <TouchableOpacity
              key={int}
              style={[
                styles.intensityButton,
                intensity === int && styles.intensityButtonActive
              ]}
              onPress={() => setIntensity(int)}
              disabled={logging}
            >
              <Text
                style={[
                  styles.intensityButtonText,
                  intensity === int && styles.intensityButtonTextActive
                ]}
              >
                {int.charAt(0).toUpperCase() + int.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.logButton, logging && styles.disabledButton]}
        onPress={handleLogExercise}
        disabled={logging}
      >
        {logging ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.logButtonText}>Log Exercise</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  typeButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd'
  },
  typeButtonActive: {
    backgroundColor: '#FF9800',
    borderColor: '#FF9800'
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  typeButtonTextActive: {
    color: '#fff'
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  intensityButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  intensityButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3'
  },
  intensityButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500'
  },
  intensityButtonTextActive: {
    color: '#fff'
  },
  logButton: {
    backgroundColor: '#FF9800',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  logButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
})
