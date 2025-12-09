import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native'
import { summaryApi, ensureSession } from '../services/api'

export default function DashboardScreen() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchDailySummary()
  }, [])

  const fetchDailySummary = async () => {
    try {
      await ensureSession()
      const today = new Date().toISOString().split('T')[0]
      const response = await summaryApi.getDailySummary(today)
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
      Alert.alert('Error', 'Failed to load dashboard data')
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
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Today's Summary</Text>

      {summary && (
        <View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Calories</Text>
            <Text style={styles.cardValue}>{summary.total_calories || 0}</Text>
            <Text style={styles.cardSubtitle}>kcal</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Protein</Text>
            <Text style={styles.cardValue}>{summary.total_protein || 0}g</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Carbs</Text>
            <Text style={styles.cardValue}>{summary.total_carbs || 0}g</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fat</Text>
            <Text style={styles.cardValue}>{summary.total_fat || 0}g</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Water Intake</Text>
            <Text style={styles.cardValue}>{summary.total_water || 0}</Text>
            <Text style={styles.cardSubtitle}>ml</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Exercise</Text>
            <Text style={styles.cardValue}>{summary.total_exercise || 0}</Text>
            <Text style={styles.cardSubtitle}>minutes</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={onRefresh}>
        <Text style={styles.buttonText}>Refresh</Text>
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
    marginBottom: 16,
    color: '#333'
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
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2196F3'
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
})
