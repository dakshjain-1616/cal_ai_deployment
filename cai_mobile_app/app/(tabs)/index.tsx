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
      setSummary(response.data as DailySummary)
    } catch (error: any) {
      console.error('Error fetching summary:', error)
      const status = error?.response?.status
      const detail = error?.response?.data?.detail as string | undefined
      const message = error?.message as string | undefined

      // If the backend returns 404 or "Not Found" for /summary/day,
      // treat it as "no data yet" instead of surfacing an error.
      if (status === 404 || detail === 'Not Found' || message?.includes('404')) {
        console.warn('Summary endpoint returned 404/Not Found, treating as no data for dashboard')
        setSummary(null)
        setError(null)
      } else {
        setError(detail || message || 'Failed to load dashboard data')
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
    backgroundColor: '#0f0f0f',
    padding: 16
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#cccccc'
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
    color: '#ffffff',
    textAlign: 'center'
  },
  errorCard: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
    borderWidth: 1,
    borderColor: 'rgba(244, 67, 54, 0.3)',
    shadowColor: '#f44336',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  errorText: {
    color: '#ff8a80',
    fontSize: 16,
    fontWeight: '600'
  },
  errorHint: {
    color: '#ffab91',
    fontSize: 14,
    marginTop: 8
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  emptyText: {
    color: '#cccccc',
    fontSize: 18,
    textAlign: 'center'
  },
  cardTitle: {
    fontSize: 16,
    color: '#4ECDC4',
    marginBottom: 12,
    textAlign: 'center'
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center'
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#cccccc',
    marginTop: 8,
    textAlign: 'center'
  },
  goalCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  goalText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#45B7D1',
    textAlign: 'center'
  },
  progressBackground: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    marginTop: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#45B7D1',
    borderRadius: 8
  },
  smallText: {
    marginTop: 12,
    color: '#cccccc',
    fontSize: 14,
    textAlign: 'center'
  },
  spacing: {
    height: 32
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalCard: {
    width: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    color: '#ffffff',
    textAlign: 'center'
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    color: '#ffffff',
    fontSize: 16
  },
  modalButtonSecondary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  modalButtonPrimary: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#4ECDC4'
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  greeting: {
    color: '#cccccc',
    fontSize: 16,
    marginBottom: 4
  },
  headerAction: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  headerActionText: {
    fontSize: 20
  },
  topRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16
  },
  calorieCard: {
    flex: 1,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10
  },
  calorieInner: {
    alignItems: 'center'
  },
  calorieLabel: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9
  },
  calorieValue: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900'
  },
  calorieUnit: {
    color: '#ffffff',
    fontSize: 14,
    opacity: 0.8
  },
  calorieGoalTextWrap: {
    marginTop: 16,
    alignItems: 'center'
  },
  goalSmall: { color: '#ffffff', fontSize: 12, opacity: 0.8 },
  goalNumber: { color: '#ffffff', fontWeight: '700', fontSize: 16, marginTop: 4 },
  remainingText: { color: '#ffffff', fontSize: 12, marginTop: 6, opacity: 0.9 },
  summaryGrid: { width: 140, justifyContent: 'space-between' },
  statCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  statTitle: { color: '#cccccc', fontSize: 14, fontWeight: '600' },
  statValue: { color: '#4ECDC4', fontWeight: '800', fontSize: 20 },
  macrosCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, marginTop: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  macroRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  macroLabel: { width: 80, color: '#ffffff', fontWeight: '600' },
  macroBarBackground: { flex: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, marginHorizontal: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  macroBarFill: { height: '100%', borderRadius: 10 },
  macroValue: { width: 50, textAlign: 'right', color: '#ffffff', fontWeight: '600' }
})
