import React, { useState, useEffect } from 'react'
import { View, Text, Button, Image, StyleSheet, ActivityIndicator, FlatList, Alert, TouchableOpacity, Platform, TextInput, ScrollView } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { uploadImageForScan, ensureSession, persistMealFromImage, foodApi } from '@/src/services/api'

export default function ScanScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (lib.status !== 'granted') {
        Alert.alert('Permission required', 'Camera roll permission is required to pick images')
      }
      // Request camera permissions too so we can take photos
      const cam = await ImagePicker.requestCameraPermissionsAsync()
      if (cam.status !== 'granted') {
        // on iOS the user may still pick from library; just warn
        console.warn('Camera permission not granted')
      }
    })()
  }, [])

  const pickImage = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        // pass native-expected media type array
        mediaTypes: (['images'] as any),
        allowsEditing: true,
        quality: 0.8,
      })

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0]
        setImage(asset.uri)
        await scanImage(asset)
      }
    } catch (e) {
      console.error('Image pick error', e)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const takePhoto = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        // iOS expects an array of media types; use lowercase 'images'
        mediaTypes: (['images'] as any),
        allowsEditing: true,
        quality: 0.8
      })
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0]
        setImage(asset.uri)
        await scanImage(asset)
      }
    } catch (e) {
      console.error('Camera error', e)
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const scanImage = async (asset: any) => {
    try {
      setLoading(true)
      await ensureSession()
      const file = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.type ? `image/${asset.type}` : 'image/jpeg'
      }
      const data = await uploadImageForScan(file)
      // backend may return array or { foods: [...] }
      const foods = Array.isArray(data) ? data : data?.foods || []
      // normalize entries and ensure numeric grams
      const normalized = foods.map((f: any) => ({
        name: f.name || f.model_label || 'food',
        grams: Number(f.grams || 100),
        calories: Number(f.calories || 0),
        protein_g: Number(f.protein_g || 0),
        carbs_g: Number(f.carbs_g || 0),
        fat_g: Number(f.fat_g || 0),
        model_label: f.model_label || f.name || 'unknown',
        confidence: Number(f.confidence || 0.75)
      }))
      setResults(normalized)
      if (!foods || foods.length === 0) {
        Alert.alert('No items found', 'AI could not detect foods in the image')
      }
    } catch (e) {
      console.error('Scan failed', e)
      const message = (e && (e as any).message) || String(e) || 'Failed to scan image'
      Alert.alert('Scan Error', message)
    } finally {
      setLoading(false)
    }
  }

  const updateGrams = (index: number, gramsText: string) => {
    const g = parseFloat(gramsText)
    if (Number.isNaN(g) || g <= 0) return
    setResults(prev => {
      const copy = [...prev]
      const item = { ...copy[index] }
      const factor = g / (item.grams || g)
      item.calories = Math.round((item.calories || 0) * factor * 10) / 10
      item.protein_g = Math.round((item.protein_g || 0) * factor * 10) / 10
      item.carbs_g = Math.round((item.carbs_g || 0) * factor * 10) / 10
      item.fat_g = Math.round((item.fat_g || 0) * factor * 10) / 10
      item.grams = g
      copy[index] = item
      return copy
    })
  }

  const saveScanAsMeal = async () => {
    if (!image) return Alert.alert('No image', 'Select an image to save')
    try {
      setLoading(true)
      await ensureSession()
      const file = {
        uri: image,
        name: `photo_${Date.now()}.jpg`,
        type: 'image/jpeg'
      }
      const meal = await persistMealFromImage(file)
      Alert.alert('Saved', 'Scan persisted as meal')
      // Optionally navigate or refresh dashboard
    } catch (err) {
      console.error('Save failed', err)
      Alert.alert('Save Error', (err && (err as any).message) || String(err) || 'Failed to save meal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Food Image</Text>

      <View style={styles.preview}>
        {image ? (
          <Image source={{ uri: image }} style={styles.image} />
        ) : (
          <View style={styles.placeholder}><Text style={styles.placeholderText}>No image selected</Text></View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
          <Text style={styles.primaryButtonText}>Pick Image</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={takePhoto}>
          <Text style={styles.primaryButtonText}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      <View style={{ width: '100%', marginTop: 8 }}>
        <TouchableOpacity style={styles.ghostButton} onPress={saveScanAsMeal}>
          <Text style={styles.ghostButtonText}>Save Scan as Meal</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator size="large" color="#2196F3" style={{ marginTop: 12 }} />}

      {!loading && results && results.length > 0 && (
        <View style={{ marginTop: 12, width: '100%' }}>
          <Text style={styles.resultTitle}>Parsed Foods</Text>
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${item.name}_${idx}`}
            renderItem={({ item, index }) => (
              <View style={styles.resultItem}>
                <Text style={styles.foodName}>{item.name}</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={styles.foodMeta}>{item.grams} g • {Math.round(item.calories)} kcal</Text>
                    <Text style={styles.confidence}>Confidence: {Math.round((item.confidence||0)*100)}%</Text>
                  </View>
                  <View style={{ width: 120 }}>
                    <TextInput
                      style={styles.gramsInput}
                      value={String(item.grams)}
                      keyboardType='numeric'
                      onChangeText={(t) => updateGrams(index, t)}
                    />
                  </View>
                </View>
              </View>
            )}
          />

          <View style={{ marginTop: 8, marginBottom: 24 }}>
            <TouchableOpacity style={[styles.primaryButton, { alignSelf: 'stretch' }]} onPress={async () => {
              try {
                setLoading(true)
                // Build structured foods payload including nutrition
                const payload = results.map(r => ({
                  name: r.name,
                  grams: Number(r.grams),
                  calories: Number(r.calories),
                  protein_g: Number(r.protein_g),
                  carbs_g: Number(r.carbs_g),
                  fat_g: Number(r.fat_g),
                  model_label: r.model_label,
                  confidence: r.confidence
                }))
                const resp = await foodApi.logFood(payload)
                // Show clear confirmation and ensure button feedback
                Alert.alert('Saved', `Meal logged: ${resp?.data?.meal_id || resp?.data?.meal || 'ok'}`)
                // clear image/results
                setImage(null)
                setResults([])
              } catch (e) {
                console.error('Save structured meal failed', e)
                const errMsg = (e as any)?.response?.data?.detail || (e as any)?.message || String(e)
                Alert.alert('Error', errMsg)
              } finally {
                setLoading(false)
              }
            }}>
              <Text style={styles.primaryButtonText}>Save as Meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f0f6ff', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#003f8a' },
  preview: { width: '100%', height: 240, backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#999' },
  actions: { marginTop: 12, width: '100%', flexDirection: 'row', gap: 8 },
  primaryButton: { backgroundColor: '#0066FF', padding: 12, borderRadius: 8, alignItems: 'center', flex: 1, marginRight: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '700' },
  ghostButton: { borderColor: '#0066FF', borderWidth: 1, padding: 12, borderRadius: 8, alignItems: 'center', flex: 1 },
  ghostButtonText: { color: '#0066FF', fontWeight: '700' },
  resultTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  resultItem: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 8 },
  foodName: { fontSize: 16, fontWeight: '700' },
  foodMeta: { color: '#555' },
  confidence: { color: '#888', marginTop: 4 }
  ,
  gramsInput: {
    borderWidth: 1,
    borderColor: '#e6eefc',
    padding: 8,
    borderRadius: 6,
    textAlign: 'center',
    backgroundColor: '#fbfdff'
  }
})
