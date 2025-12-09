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
import { waterApi, ensureSession } from '@/src/services/api'

export default function WaterTrackerScreen() {
  const [customAmount, setCustomAmount] = useState('')
  const [logging, setLogging] = useState(false)

  const commonAmounts = [250, 500, 750, 1000]

  const handleLogWater = async (amount) => {
    if (!amount || amount <= 0) {
      Alert.alert('Invalid', 'Please enter a valid water amount')
      return
    }

    setLogging(true)
    try {
      await ensureSession()
      await waterApi.logWater(amount)
      Alert.alert('✅ Success', `Logged ${amount}ml of water`)
      setCustomAmount('')
    } catch (error) {
      console.error('Error logging water:', error)
      const msg = error?.response?.data?.detail || error?.message || 'Failed to log water'
      Alert.alert('❌ Error', msg)
    } finally {
      setLogging(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💧 Water Tracker</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Add</Text>
        <View style={styles.buttonGrid}>
          {commonAmounts.map((amount) => (
            <TouchableOpacity
              key={amount}
              style={[styles.quickButton, logging && styles.disabledButton]}
              onPress={() => handleLogWater(amount)}
              disabled={logging}
            >
              {logging ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.quickButtonText}>{amount}ml</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Custom Amount</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter amount in ml"
            value={customAmount}
            onChangeText={setCustomAmount}
            keyboardType="decimal-pad"
            editable={!logging}
          />
          <TouchableOpacity
            style={[styles.addButton, logging && styles.disabledButton]}
            onPress={() => handleLogWater(parseFloat(customAmount))}
            disabled={logging}
          >
            {logging ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.addButtonText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>• Drink 8-10 glasses of water daily</Text>
        <Text style={styles.tipText}>• More water intake if exercising</Text>
        <Text style={styles.tipText}>• Track throughout the day</Text>
      </View>
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
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickButton: {
    width: '48%',
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  disabledButton: {
    backgroundColor: '#ccc'
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center'
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  tipsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 32
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333'
  },
  tipText: {
    color: '#666',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20
  }
})
