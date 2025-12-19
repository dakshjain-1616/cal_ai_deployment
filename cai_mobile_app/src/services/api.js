import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// For development: use local IP or ngrok
// For production: use your deployed backend URL
const BACKEND_URL = (process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.29.198:8000').replace(/\/$/, '')
const SESSION_KEY = 'calai_session'
let sessionPromise = null

const todayIso = () => new Date().toISOString().split('T')[0]

const getStoredSession = async () => {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse stored session', error)
    return null
  }
}

export const clearSession = async () => {
  await AsyncStorage.removeItem(SESSION_KEY)
}

export const storeSession = async (session) => {
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const getSession = async () => getStoredSession()
export const getSessionUserId = async () => (await getStoredSession())?.userId ?? null
export const getSessionToken = async () => (await getStoredSession())?.token ?? null

export const ensureSession = async () => {
  const existing = await getStoredSession()
  if (existing?.token) {
    return existing.token
  }

  // If no stored session, throw an error to force login
  throw new Error('No authentication session found. Please login.')
}

// Setup axios interceptor for auth
const api = axios.create({
  baseURL: BACKEND_URL,
  timeout: 20000
})

api.interceptors.request.use(async (config) => {
  try {
    const token = await ensureSession()
    if (token) {
      // backend expects X-Auth-Token header
      config.headers['X-Auth-Token'] = token
    }
  } catch (error) {
    console.error('Error in request interceptor:', error)
  }
  return config
})

// Normalize response errors so callers always get an Error with useful message
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    // Handle 401 Unauthorized - clear session and redirect to login
    if (error.response?.status === 401) {
      await clearSession()
      // Force app to restart authentication flow
      // This will cause the app to show login screen on next API call
      const authError = new Error('Authentication required. Please login.')
      authError.code = 'AUTH_REQUIRED'
      return Promise.reject(authError)
    }

    // Network errors (no response) are common in RN; wrap with clearer message
    if (!error.response) {
      const e = new Error(`Network Error: cannot reach backend at ${BACKEND_URL}`)
      e.original = error
      return Promise.reject(e)
    }
    return Promise.reject(error)
  }
)

// Simple health check helper
export const pingBackend = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/health`)
    return res.ok
  } catch (e) {
    return false
  }
}

// Create a separate axios instance for auth endpoints that don't require authentication
const authApiClient = axios.create({
  baseURL: BACKEND_URL,
  timeout: 20000
})

// Auth API (doesn't require authentication)
export const authApi = {
  register: (email, password) =>
    authApiClient.post('/auth/register', { email, password }),
  login: (email, password) =>
    authApiClient.post('/auth/login', { email, password }),
  createProfile: (profileData) =>
    api.post('/auth/profile', profileData),
  updateProfile: (userId, profileData) =>
    api.put(`/auth/profile/${userId}`, profileData),
  getProfile: (userId) =>
    api.get(`/auth/profile/${userId}`)
}

// Food API
export const foodApi = {
  logFood: (mealData) =>
    api.post('/meals', mealData),
  getMealHistory: (date) =>
    api.get(`/meals/history?date=${date}`),
  getMealHistoryRange: (startDate, endDate) =>
    api.get(`/meals/history?start_date=${startDate}&end_date=${endDate}`),
  scanFood: (image) => {
    const formData = new FormData()
    // field name 'file' matches backend UploadFile parameter
    formData.append('file', image)
    // Let axios set Content-Type (boundary) automatically
    return api.post('/meals/scan', formData)
  }
}

// Helper to upload an image URI (from Expo ImagePicker) for scanning
export const uploadImageForScan = async (imageUri) => {
  // imageUri: { uri, name, type } or string uri
  const formData = new FormData()

  let fileObj = null
  if (typeof imageUri === 'string') {
    // Need to derive a name and type
    const uri = imageUri
    const name = uri.split('/').pop() || 'photo.jpg'
    const type = 'image/jpeg'
    fileObj = { uri, name, type }
  } else {
    fileObj = imageUri
  }

  formData.append('file', fileObj)

  // Try axios first (works in many RN setups). If it fails, fallback to fetch.
  try {
    const res = await api.post('/meals/scan', formData)
    return res.data
  } catch (err) {
    try {
      const token = await getSessionToken()
      const res = await fetch(`${BACKEND_URL}/meals/scan`, {
        method: 'POST',
        headers: {
          // Let fetch set Content-Type for FormData; only add auth header
          ...(token ? { 'X-Auth-Token': token } : {})
        },
        body: formData
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Upload failed with status ${res.status}`)
      }
      return await res.json()
    } catch (err2) {
      throw err2
    }
  }
}

// Persist scanned image as a meal (calls /meals/from-image)
export const persistMealFromImage = async (imageUri) => {
  const formData = new FormData()
  let fileObj = null
  if (typeof imageUri === 'string') {
    const uri = imageUri
    const name = uri.split('/').pop() || 'photo.jpg'
    const type = 'image/jpeg'
    fileObj = { uri, name, type }
  } else {
    fileObj = imageUri
  }
  formData.append('file', fileObj)
  try {
    const res = await api.post('/meals/from-image', formData)
    return res.data
  } catch (err) {
    try {
      const token = await getSessionToken()
      const res = await fetch(`${BACKEND_URL}/meals/from-image`, {
        method: 'POST',
        headers: {
          ...(token ? { 'X-Auth-Token': token } : {})
        },
        body: formData
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Upload failed with status ${res.status}`)
      }
      return await res.json()
    } catch (err2) {
      throw err2
    }
  }
}

// Exercise API
export const exerciseApi = {
  logExercise: (exerciseData) =>
    api.post('/exercise', exerciseData),
  getExerciseHistory: (date) =>
    api.get(`/exercise/history?date=${date}`),
  getExerciseHistoryRange: (startDate, endDate) =>
    api.get(`/exercise/history?start_date=${startDate}&end_date=${endDate}`)
}

// Water API
export const waterApi = {
  logWater: (amount) =>
    api.post('/water', { amount: amount }),
  getWaterIntake: (date) =>
    api.get(`/water?date=${date}`)
}

// Weight API
export const weightApi = {
  logWeight: (weight, unit = 'kg') =>
    api.post('/weight', { weight, unit }),
  getWeightHistory: (startDate, endDate) =>
    api.get(`/weight/history?start_date=${startDate}&end_date=${endDate}`)
}

// Summary API
export const summaryApi = {
  getDailySummary: (date) =>
    api.get(`/summary/day?date=${date}`),
  getProgressMetrics: (startDate, endDate) =>
    api.get(`/summary/progress?start_date=${startDate}&end_date=${endDate}`)
}

export default api
