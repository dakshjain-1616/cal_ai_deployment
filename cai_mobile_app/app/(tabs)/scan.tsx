import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Platform
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'
import { uploadImageForScan, ensureSession, persistMealFromImage, foodApi } from '@/src/services/api'

const { width: screenWidth } = Dimensions.get('window')

export default function ScanScreen() {
  const [image, setImage] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [results, setResults] = useState<any[]>([])
  const [scanMode, setScanMode] = useState<'preview' | 'results'>('preview')
  const [recentScans, setRecentScans] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()

      if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
        Toast.show({
          type: 'info',
          text1: 'Permissions Needed',
          text2: 'Please enable camera and photo library access'
        })
      }
    })()
  }, [])

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        aspect: [4, 3],
        allowsMultipleSelection: false,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        setImage(asset.uri)
        setScanMode('preview')
        Toast.show({
          type: 'success',
          text1: 'Image Selected!',
          text2: 'Tap scan to analyze foods'
        })
      }
    } catch (error) {
      console.error('Image pick error:', error)
      Toast.show({
        type: 'error',
        text1: 'Failed to pick image',
        text2: 'Please try again'
      })
    }
  }

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
        aspect: [4, 3],
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        setImage(asset.uri)
        setScanMode('preview')
        Toast.show({
          type: 'success',
          text1: 'Photo captured!',
          text2: 'Tap scan to analyze foods'
        })
      }
    } catch (error) {
      console.error('Camera error:', error)
      Toast.show({
        type: 'error',
        text1: 'Failed to take photo',
        text2: 'Please try again'
      })
    }
  }

  const scanImage = async () => {
    if (!image) {
      Toast.show({
        type: 'info',
        text1: 'No image selected',
        text2: 'Please pick an image or take a photo first'
      })
      return
    }

    try {
      setLoading(true)
      setScanMode('results')

      await ensureSession()

      const file = {
        uri: image,
        name: `scan_${Date.now()}.jpg`,
        type: 'image/jpeg'
      }

      const data = await uploadImageForScan(file)
      const foods = Array.isArray(data) ? data : data?.foods || []

      if (!foods || foods.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No foods detected',
          text2: 'Try a clearer image of your meal'
        })
        return
      }

      const normalized = foods.map((f: any) => ({
        name: f.name || f.model_label || 'Unknown Food',
        grams: Number(f.grams || 150),
        calories: Number(f.calories || 0),
        protein_g: Number(f.protein_g || 0),
        carbs_g: Number(f.carbs_g || 0),
        fat_g: Number(f.fat_g || 0),
        model_label: f.model_label || f.name || 'unknown',
        confidence: Number(f.confidence || 0.75)
      }))

      setResults(normalized)

      Toast.show({
        type: 'success',
        text1: `${foods.length} food${foods.length > 1 ? 's' : ''} detected!`,
        text2: 'Review and adjust portions if needed'
      })

    } catch (error: any) {
      console.error('Scan failed:', error)
      const message = error?.response?.data?.detail || error?.message || 'Scan failed'
      Toast.show({
        type: 'error',
        text1: 'Scan failed',
        text2: message
      })
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

  const saveMeal = async () => {
    if (!results || results.length === 0) return

    try {
      setLoading(true)

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

      await foodApi.logFood(payload)

      // Add to recent scans
      const newScan = {
        id: Date.now(),
        image,
        foods: results,
        timestamp: new Date(),
        totalCalories: results.reduce((sum, food) => sum + food.calories, 0)
      }
      setRecentScans(prev => [newScan, ...prev.slice(0, 4)]) // Keep last 5

      Toast.show({
        type: 'success',
        text1: 'Meal logged successfully!',
        text2: `${Math.round(results.reduce((sum, food) => sum + food.calories, 0))} calories added`
      })

      // Reset state
      setImage(null)
      setResults([])
      setScanMode('preview')

    } catch (error: any) {
      console.error('Save meal failed:', error)
      const message = error?.response?.data?.detail || error?.message || 'Failed to save meal'
      Toast.show({
        type: 'error',
        text1: 'Failed to save meal',
        text2: message
      })
    } finally {
      setLoading(false)
    }
  }

  const loadRecentScan = (scan: any) => {
    setImage(scan.image)
    setResults(scan.foods)
    setScanMode('results')
    Toast.show({
      type: 'info',
      text1: 'Recent scan loaded',
      text2: 'You can modify portions before saving'
    })
  }

  const getTotalNutrition = () => {
    if (!results.length) return { calories: 0, protein: 0, carbs: 0, fat: 0 }

    return results.reduce((total, food) => ({
      calories: total.calories + food.calories,
      protein: total.protein + food.protein_g,
      carbs: total.carbs + food.carbs_g,
      fat: total.fat + food.fat_g
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>🍽️ CalAI Food Scanner</Text>
      <Text style={styles.subtitle}>Smart meal analysis powered by AI</Text>

      {/* Image Preview Section */}
      <View style={styles.imageSection}>
        {image ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => {
                setScanMode('preview')
                setResults([])
              }}
            >
              <Text style={styles.rescanButtonText}>🔄 Rescan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Select an image to analyze your meal</Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={pickImage}>
          <Text style={styles.primaryButtonText}>📱 Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={takePhoto}>
          <Text style={styles.secondaryButtonText}>📸 Camera</Text>
        </TouchableOpacity>
      </View>

      {/* Scan Button */}
      {image && scanMode === 'preview' && (
        <TouchableOpacity style={styles.scanButton} onPress={scanImage} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.scanButtonText}>🔍 Analyze Food</Text>
          )}
        </TouchableOpacity>
      )}

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>AI is analyzing your meal...</Text>
        </View>
      )}

      {/* Results Section */}
      {!loading && scanMode === 'results' && results.length > 0 && (
        <View style={styles.resultsSection}>
          <Text style={styles.sectionTitle}>🍎 Detected Foods</Text>

          {/* Nutrition Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Meal Summary</Text>
            {(() => {
              const totals = getTotalNutrition()
              return (
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{Math.round(totals.calories)}</Text>
                    <Text style={styles.summaryLabel}>Calories</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{Math.round(totals.protein)}g</Text>
                    <Text style={styles.summaryLabel}>Protein</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{Math.round(totals.carbs)}g</Text>
                    <Text style={styles.summaryLabel}>Carbs</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{Math.round(totals.fat)}g</Text>
                    <Text style={styles.summaryLabel}>Fat</Text>
                  </View>
                </View>
              )
            })()}
          </View>

          {/* Food List */}
          <FlatList
            data={results}
            keyExtractor={(item, idx) => `${item.name}_${idx}`}
            scrollEnabled={false}
            renderItem={({ item, index }) => (
              <View style={styles.foodCard}>
                <View style={styles.foodHeader}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>
                      {Math.round((item.confidence || 0) * 100)}%
                    </Text>
                  </View>
                </View>

                <View style={styles.foodDetails}>
                  <View style={styles.portionSection}>
                    <Text style={styles.portionLabel}>Portion</Text>
                    <View style={styles.portionInput}>
                      <TextInput
                        style={styles.gramsInput}
                        value={String(item.grams)}
                        keyboardType="numeric"
                        onChangeText={(text) => updateGrams(index, text)}
                        maxLength={4}
                      />
                      <Text style={styles.gramsUnit}>g</Text>
                    </View>
                  </View>

                  <View style={styles.nutritionSection}>
                    <Text style={styles.nutritionValue}>
                      {Math.round(item.calories)} kcal
                    </Text>
                    <Text style={styles.nutritionMacros}>
                      P:{Math.round(item.protein_g)}g C:{Math.round(item.carbs_g)}g F:{Math.round(item.fat_g)}g
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={saveMeal} disabled={loading}>
            <Text style={styles.saveButtonText}>💾 Save Meal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recent Scans */}
      {!loading && recentScans.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>📚 Recent Scans</Text>
          <FlatList
            data={recentScans}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentCard}
                onPress={() => loadRecentScan(item)}
              >
                <Image source={{ uri: item.image }} style={styles.recentImage} />
                <View style={styles.recentOverlay}>
                  <Text style={styles.recentCalories}>
                    {Math.round(item.totalCalories)} kcal
                  </Text>
                  <Text style={styles.recentFoods}>
                    {item.foods.length} food{item.foods.length > 1 ? 's' : ''}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Tips Section */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Pro Tips</Text>
        <Text style={styles.tipsText}>
          • Take photos in good lighting{'\n'}
          • Include serving sizes when possible{'\n'}
          • Adjust portions for accuracy{'\n'}
          • Save frequently eaten meals
        </Text>
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
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400'
  },
  imageSection: {
    marginBottom: 24
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12
  },
  image: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.75,
    borderRadius: 20
  },
  rescanButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20
  },
  rescanButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  placeholder: {
    width: screenWidth - 32,
    height: (screenWidth - 32) * 0.75,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed'
  },
  placeholderIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  placeholderText: {
    color: '#cccccc',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#45B7D1',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#45B7D1',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  scanButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF6B35',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1
  },
  loadingCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center'
  },
  resultsSection: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 16,
    textAlign: 'center'
  },
  summaryCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    shadowColor: '#4ECDC4',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ECDC4',
    marginBottom: 16,
    textAlign: 'center'
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  summaryItem: {
    alignItems: 'center'
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#cccccc',
    marginTop: 4,
    textAlign: 'center'
  },
  foodCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  foodName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    flex: 1
  },
  confidenceBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  confidenceText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600'
  },
  foodDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  portionSection: {
    flex: 1
  },
  portionLabel: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 4
  },
  portionInput: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  gramsInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 80,
    textAlign: 'center'
  },
  gramsUnit: {
    color: '#cccccc',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600'
  },
  nutritionSection: {
    alignItems: 'flex-end'
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4
  },
  nutritionMacros: {
    fontSize: 12,
    color: '#cccccc'
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1
  },
  recentSection: {
    marginBottom: 24
  },
  recentCard: {
    width: 120,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  recentImage: {
    width: '100%',
    height: 80
  },
  recentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8
  },
  recentCalories: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  recentFoods: {
    color: '#cccccc',
    fontSize: 12
  },
  tipsSection: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ECDC4',
    marginBottom: 12,
    textAlign: 'center'
  },
  tipsText: {
    color: '#cccccc',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center'
  }
})
