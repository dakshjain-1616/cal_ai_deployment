import React, { useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking
} from 'react-native'
import { clearSession, getSession } from '../services/api'

export default function SettingsScreen() {
  const [session, setSession] = useState(null)

  React.useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    const sess = await getSession()
    setSession(sess)
  }

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: async () => {
          await clearSession()
          setSession(null)
          Alert.alert('Success', 'Logged out successfully')
        }
      }
    ])
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Backend URL</Text>
          <Text style={styles.infoValue}>192.168.1.X:8000</Text>
        </View>
        {session && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>{session.userId}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Data</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Daily Calorie Goal</Text>
          <Text style={styles.settingValue}>2000 kcal</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Water Goal</Text>
          <Text style={styles.settingValue}>8 glasses</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Exercise Goal</Text>
          <Text style={styles.settingValue}>30 min/day</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => Alert.alert('Help', 'Contact support at help@cai.app')}
        >
          <Text style={styles.settingText}>Help & Support</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() =>
            Linking.openURL('https://github.com/yourusername/cai-app')
          }
        >
          <Text style={styles.settingText}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with ❤️ by CAI Team</Text>
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
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333'
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8
  },
  infoLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  settingItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500'
  },
  settingValue: {
    fontSize: 12,
    color: '#2196F3'
  },
  logoutButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16
  },
  footerText: {
    fontSize: 12,
    color: '#999'
  }
})
