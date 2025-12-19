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
import Toast from 'react-native-toast-message'
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
        Toast.show({
          type: 'success',
          text1: `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} ${exerciseType} Added!`,
          text2: `Logged ${duration} minutes, burned ~${caloriesBurned} kcal`
        })
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
    backgroundColor: '#0f0f0f',
    padding: 16
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#ffffff',
    textAlign: 'center'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  typeButton: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  typeButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
    transform: [{scale: 1.05}]
  },
  typeButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600'
  },
  typeButtonTextActive: {
    color: '#ffffff'
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    color: '#ffffff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  intensityButton: {
    flex: 1,
    marginHorizontal: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  intensityButtonActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
    transform: [{scale: 1.05}]
  },
  intensityButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600'
  },
  intensityButtonTextActive: {
    color: '#ffffff'
  },
  logButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  disabledButton: {
    backgroundColor: '#666',
    shadowOpacity: 0.1
  },
  logButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1
  }
})
