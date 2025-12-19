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
import { waterApi, ensureSession } from '@/src/services/api'

export default function WaterTrackerScreen() {
  const [customAmount, setCustomAmount] = useState('')
  const [logging, setLogging] = useState(false)

  const commonAmounts = [250, 500, 750, 1000]

  const handleLogWater = async (amount: number) => {
    if (!amount || amount <= 0) {
      Alert.alert('Invalid', 'Please enter a valid water amount')
      return
    }

    setLogging(true)
    try {
      await ensureSession()
      await waterApi.logWater(amount)
      Toast.show({
        type: 'success',
        text1: 'Water Added!',
        text2: `Logged ${amount}ml of water`
      })
      setCustomAmount('')
    } catch (error: any) {
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
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  quickButton: {
    width: '48%',
    backgroundColor: '#45B7D1',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#45B7D1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  disabledButton: {
    backgroundColor: '#666',
    shadowOpacity: 0.1
  },
  quickButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 12
  },
  input: {
    flex: 1,
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
  addButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#4ECDC4',
    textAlign: 'center'
  },
  tipText: {
    color: '#cccccc',
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 22,
    textAlign: 'center'
  }
})
