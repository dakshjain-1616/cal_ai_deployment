import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  TouchableOpacity
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { summaryApi, ensureSession } from '@/src/services/api'

// Types matching backend DailySummaryResponse
type Macros = {
  protein_g: number
  carbs_g: number
  fat_g: number
}

type DailySummary = {
  date: string
  total_calories: number
  total_macros: Macros
  remaining_calories: number
  total_water?: number
  total_exercise?: number
}

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [showSetGoalModal, setShowSetGoalModal] = useState(false)
  const [draftGoal, setDraftGoal] = useState('')

  useEffect(() => {
    fetchDailySummary()
    fetchCalorieGoal()
  }, [])

  const fetchCalorieGoal = async () => {
    try {
      const raw = await AsyncStorage.getItem('calorie_goal')
      if (raw) {
        const val = parseInt(raw, 10)
        if (!Number.isNaN(val)) setCalorieGoal(val)
        return true
      }
      // no saved goal -> request user set it
      setShowSetGoalModal(true)
      return false
    } catch (e) {
      console.warn('Failed to load calorie goal, using default', e)
      return false
    }
  }

  const saveCalorieGoal = async (value: string) => {
    try {
      const v = parseInt(value, 10)
      if (Number.isNaN(v) || v <= 0) {
        Alert.alert('Invalid', 'Please enter a positive number')
        return
      }
      await AsyncStorage.setItem('calorie_goal', String(v))
      setCalorieGoal(v)
      setShowSetGoalModal(false)
      setDraftGoal('')
      Alert.alert('Saved', `Daily calorie goal set to ${v} kcal`)
    } catch (e) {
      console.error('Failed to save calorie goal', e)
      Alert.alert('Error', 'Unable to save calorie goal')
    }
  }

  const fetchDailySummary = async () => {
    try {
      setError(null)
      await ensureSession()
      const today = new Date().toISOString().split('T')[0]
      const response = await summaryApi.getDailySummary(today)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
      const status = error?.response?.status

      // If the backend returns 404 for /summary/day, treat it as "no data yet"
      // instead of surfacing an error on the dashboard.
      if (status === 404) {
        console.warn('Summary endpoint returned 404, treating as no data for dashboard')
        setSummary(null)
        setError(null)
      } else {
        const msg = error?.response?.data?.detail || error?.message || 'Failed to load dashboard data'
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = React.useCallback(() => {
    setRefreshing(true)
    fetchDailySummary().then(() => setRefreshing(false))
  }, [])

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Modal visible={showSetGoalModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set your daily calorie goal</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 2000"
              keyboardType="number-pad"
              value={draftGoal}
              onChangeText={setDraftGoal}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
              <TouchableOpacity onPress={() => { setShowSetGoalModal(false); setDraftGoal('') }} style={styles.modalButtonSecondary}>
                <Text style={styles.modalButtonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => saveCalorieGoal(draftGoal || String(calorieGoal))} style={styles.modalButtonPrimary}>
                <Text style={[styles.modalButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Good day —</Text>
          <Text style={styles.title}>Today's Summary</Text>
        </View>
        <TouchableOpacity style={styles.headerAction} onPress={() => setShowSetGoalModal(true)}>
          <Text style={styles.headerActionText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Text style={styles.errorHint}>Pull down to retry</Text>
        </View>
      )}
      {summary ? (
        <View>
          <View style={styles.topRow}>
            <View style={styles.calorieCard}>
              <View style={styles.calorieInner}>
                <Text style={styles.calorieLabel}>Consumed</Text>
                <Text style={styles.calorieValue}>{Math.round(summary.total_calories ?? 0)}</Text>
                <Text style={styles.calorieUnit}>kcal</Text>
              </View>
              <View style={styles.calorieGoalTextWrap}>
                <Text style={styles.goalSmall}>Goal</Text>
                <Text style={styles.goalNumber}>{calorieGoal} kcal</Text>
                <Text style={styles.remainingText}>{Math.max(0, calorieGoal - Math.round(summary.total_calories ?? 0))} kcal left</Text>
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Water</Text>
                <Text style={styles.statValue}>{summary.total_water ?? 0} ml</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statTitle}>Exercise</Text>
                <Text style={styles.statValue}>{summary.total_exercise ?? 0} min</Text>
              </View>
            </View>
          </View>

          <View style={styles.macrosCard}>
            <Text style={styles.cardTitle}>Macros</Text>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroBarBackground}>
                <View style={[styles.macroBarFill, { width: `${Math.min(100, ((summary.total_macros?.protein_g ?? 0) / Math.max(1, Math.max(summary.total_macros?.protein_g ?? 0, summary.total_macros?.carbs_g ?? 0, summary.total_macros?.fat_g ?? 0))) * 100)}%`, backgroundColor: '#4caf50' }]} />
              </View>
              <Text style={styles.macroValue}>{Math.round(summary.total_macros?.protein_g ?? 0)} g</Text>
            </View>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <View style={styles.macroBarBackground}>
                <View style={[styles.macroBarFill, { width: `${Math.min(100, ((summary.total_macros?.carbs_g ?? 0) / Math.max(1, Math.max(summary.total_macros?.protein_g ?? 0, summary.total_macros?.carbs_g ?? 0, summary.total_macros?.fat_g ?? 0))) * 100)}%`, backgroundColor: '#2196F3' }]} />
              </View>
              <Text style={styles.macroValue}>{Math.round(summary.total_macros?.carbs_g ?? 0)} g</Text>
            </View>
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Fat</Text>
              <View style={styles.macroBarBackground}>
                <View style={[styles.macroBarFill, { width: `${Math.min(100, ((summary.total_macros?.fat_g ?? 0) / Math.max(1, Math.max(summary.total_macros?.protein_g ?? 0, summary.total_macros?.carbs_g ?? 0, summary.total_macros?.fat_g ?? 0))) * 100)}%`, backgroundColor: '#FFB74D' }]} />
              </View>
              <Text style={styles.macroValue}>{Math.round(summary.total_macros?.fat_g ?? 0)} g</Text>
            </View>
          </View>

        </View>
      ) : !error ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No data yet. Start tracking!</Text>
        </View>
      ) : null}

      <View style={styles.spacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef6ff',
    padding: 16
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#666'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  errorCard: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336'
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    fontWeight: '500'
  },
  errorHint: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: 6
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: '#999',
    fontSize: 16
  },
  cardTitle: {
    fontSize: 14,
    color: '#0066FF',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0066FF'
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2
  },
  goalText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2196F3'
  },
  progressBackground: {
    height: 10,
    backgroundColor: '#eef4ff',
    borderRadius: 6,
    marginTop: 10,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3'
  },
  smallText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12
  },
  spacing: {
    height: 32
  }
  ,
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#222'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e6eefc',
    backgroundColor: '#fbfdff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  modalButtonSecondary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  modalButtonPrimary: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 6,
    backgroundColor: '#2196F3'
  },
  modalButtonText: {
    color: '#333',
    fontWeight: '600'
  }
  ,
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  greeting: {
    color: '#666',
    fontSize: 14,
    marginBottom: 2
  },
  headerAction: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8
  },
  headerActionText: {
    fontSize: 18
  },
  topRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  calorieCard: {
    flex: 1,
    backgroundColor: '#001F3F',
    borderRadius: 12,
    padding: 14,
    marginRight: 12,
    justifyContent: 'center'
  },
  calorieInner: {
    alignItems: 'center'
  },
  calorieLabel: {
    color: '#9fbff9',
    fontSize: 12,
    marginBottom: 6
  },
  calorieValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800'
  },
  calorieUnit: {
    color: '#bcd3ff',
    fontSize: 12
  },
  calorieGoalTextWrap: {
    marginTop: 10,
    alignItems: 'center'
  },
  goalSmall: { color: '#cfe0ff', fontSize: 12 },
  goalNumber: { color: '#fff', fontWeight: '700', marginTop: 4 },
  remainingText: { color: '#a9c6ff', fontSize: 12, marginTop: 6 },
  summaryGrid: { width: 120, justifyContent: 'space-between' },
  statCard: { backgroundColor: '#fff', borderRadius: 8, padding: 10, marginBottom: 8, alignItems: 'center' },
  statTitle: { color: '#666', fontSize: 12 },
  statValue: { color: '#003f8a', fontWeight: '700', fontSize: 16 },
  macrosCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 8 },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  macroLabel: { width: 80, color: '#333' },
  macroBarBackground: { flex: 1, height: 10, backgroundColor: '#f1f6ff', borderRadius: 8, marginHorizontal: 10, overflow: 'hidden' },
  macroBarFill: { height: '100%', borderRadius: 8 },
  macroValue: { width: 48, textAlign: 'right', color: '#444' }
})
