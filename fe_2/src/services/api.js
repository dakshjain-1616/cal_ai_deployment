import axios from 'axios'

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000').replace(/\/$/, '')
const SESSION_KEY = 'calai_session'
let sessionPromise = null

const todayIso = () => new Date().toISOString().split('T')[0]

const getStoredSession = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) {
      return null
    }
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse stored session', error)
    return null
  }
}

const storeSession = (session) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY)
}

export const getSession = () => getStoredSession()
export const getSessionUserId = () => getStoredSession()?.userId ?? null
export const getSessionToken = () => getStoredSession()?.token ?? null

export const ensureSession = async () => {
  const existing = getStoredSession()
  if (existing?.token) {
    return existing.token
  }

  if (!sessionPromise) {
    sessionPromise = axios
      .post(`${BACKEND_URL}/auth/anonymous-session`)
      .then(({ data }) => {
        const session = {
          token: data.token,
          userId: data.user_id
        }
        storeSession(session)
        return session
      })
      .catch((error) => {
        clearSession()
        throw error
      })
      .finally(() => {
        sessionPromise = null
      })
  }

  const session = await sessionPromise
  return session.token
}

const apiClient = axios.create({
  baseURL: BACKEND_URL
})

apiClient.interceptors.request.use(async (config) => {
  if (config.__skipAuth) {
    return config
  }

  const token = await ensureSession()
  config.headers = config.headers ?? {}
  config.headers['X-Auth-Token'] = token
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    if (response?.status === 401 && config && !config.__isRetry) {
      config.__isRetry = true
      clearSession()
      const token = await ensureSession()
      config.headers = config.headers ?? {}
      config.headers['X-Auth-Token'] = token
      return apiClient.request(config)
    }
    return Promise.reject(error)
  }
)

const formatDateForQuery = (value, { optional = false } = {}) => {
  if (value === undefined || value === null || value === '') {
    if (optional) {
      return undefined
    }
    return todayIso()
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  const stringValue = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    return stringValue
  }

  const parsed = new Date(stringValue)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  throw new Error(`Invalid date value: ${value}`)
}

const mapFood = (food) => ({
  name: food.name,
  grams: Number(food.grams ?? 0),
  calories: Number(food.calories ?? 0),
  protein: Number(food.protein_g ?? 0),
  carbs: Number(food.carbs_g ?? 0),
  fat: Number(food.fat_g ?? 0),
  modelLabel: food.model_label,
  confidence: Number(food.confidence ?? 0)
})

const mapMealResponse = (meal) => {
  const totalCalories = Number(meal.total_calories ?? 0)
  const totalMacros = {
    protein: Number(meal.total_macros?.protein_g ?? 0),
    carbs: Number(meal.total_macros?.carbs_g ?? 0),
    fat: Number(meal.total_macros?.fat_g ?? 0)
  }

  return {
    id: meal.meal_id,
    mealId: meal.meal_id,
    timestamp: meal.timestamp,
    source: meal.source,
    originalInput: meal.original_input,
    foods: (meal.foods ?? []).map(mapFood),
    totalCalories,
    totalMacros,
    calories: totalCalories,
    protein: totalMacros.protein,
    carbs: totalMacros.carbs,
    fat: totalMacros.fat,
    confidence: Number(meal.confidence_score ?? 0)
  }
}

const mapWaterLog = (log) => ({
  id: log.water_log_id,
  amount: Number(log.amount ?? 0),
  timestamp: log.timestamp
})

const mapExerciseLog = (log) => ({
  id: log.exercise_log_id,
  name: log.name,
  duration: Number(log.duration ?? 0),
  caloriesBurned: Number(log.caloriesBurned ?? 0),
  timestamp: log.timestamp
})

const mapWeightLog = (log) => ({
  id: log.weight_log_id,
  weight: Number(log.weight ?? 0),
  timestamp: log.timestamp
})

const mapDailySummary = (summary) => ({
  date: summary.date,
  totalCalories: Number(summary.total_calories ?? 0),
  totalMacros: {
    protein: Number(summary.total_macros?.protein_g ?? 0),
    carbs: Number(summary.total_macros?.carbs_g ?? 0),
    fat: Number(summary.total_macros?.fat_g ?? 0)
  },
  remainingCalories: Number(summary.remaining_calories ?? 0)
})

const mapUserProfile = (profile) => ({
  userId: profile.user_id,
  dailyCalorieTarget: Number(profile.daily_calorie_target ?? 0),
  timezone: profile.timezone
})

export const getUserProfile = async () => {
  const { data } = await apiClient.get('/user/profile')
  return mapUserProfile(data)
}

export const updateUserProfile = async ({ dailyCalorieTarget, timezone } = {}) => {
  const payload = {}
  if (dailyCalorieTarget !== undefined) {
    payload.daily_calorie_target = Number(dailyCalorieTarget)
  }
  if (timezone) {
    payload.timezone = timezone
  }
  const { data } = await apiClient.put('/user/profile', payload)
  return mapUserProfile(data)
}

export const createUserProfile = updateUserProfile

export const logMealFromText = async (description) => {
  if (!description || !description.trim()) {
    throw new Error('Meal description is required')
  }
  const { data } = await apiClient.post('/meals/from-text', {
    description: description.trim()
  })
  return mapMealResponse(data)
}

export const logMealFromImage = async (file, filename = 'meal.jpg') => {
  if (!file) {
    throw new Error('File is required to log meal from image')
  }
  const formData = new FormData()
  formData.append('file', file, filename)
  const { data } = await apiClient.post('/meals/from-image', formData)
  return mapMealResponse(data)
}

export const logMealFromBarcode = async ({ barcode, servingDescription, servings = 1 }) => {
  if (!barcode || !barcode.trim()) {
    throw new Error('Barcode is required')
  }
  const { data } = await apiClient.post('/meals/from-barcode', {
    barcode: barcode.trim(),
    serving_description: servingDescription || undefined,
    servings
  })
  return mapMealResponse(data)
}

export const getMeals = async (date) => {
  const { data } = await apiClient.get('/meals', {
    params: { date: formatDateForQuery(date) }
  })
  return data.map(mapMealResponse)
}

export const getMeal = async (mealId) => {
  const { data } = await apiClient.get(`/meals/${mealId}`)
  return mapMealResponse(data)
}

export const deleteMeal = async (mealId) => {
  await apiClient.delete(`/meals/${mealId}`)
}

export const getDailySummary = async (date) => {
  const { data } = await apiClient.get('/summary/day', {
    params: { date: formatDateForQuery(date) }
  })
  return mapDailySummary(data)
}

export const logWater = async (amount, date) => {
  if (amount === undefined || amount === null) {
    throw new Error('Water amount is required')
  }
  const payload = {
    amount: Number(amount)
  }
  const maybeDate = formatDateForQuery(date, { optional: true })
  if (maybeDate) {
    payload.date = maybeDate
  }
  const { data } = await apiClient.post('/water', payload)
  return mapWaterLog(data)
}

export const getWaterLogs = async (date) => {
  const params = {}
  const maybeDate = formatDateForQuery(date, { optional: true })
  if (maybeDate) {
    params.date = maybeDate
  }
  const { data } = await apiClient.get('/water', { params })
  return data.map(mapWaterLog)
}

export const deleteWaterLog = async (waterLogId) => {
  await apiClient.delete(`/water/${waterLogId}`)
}

export const logExercise = async ({ name, duration, caloriesBurned, date }) => {
  if (!name || !name.trim()) {
    throw new Error('Exercise name is required')
  }
  const payload = {
    name: name.trim(),
    duration: Number(duration ?? 0),
    caloriesBurned: Number(caloriesBurned ?? 0)
  }
  const maybeDate = formatDateForQuery(date, { optional: true })
  if (maybeDate) {
    payload.date = maybeDate
  }
  const { data } = await apiClient.post('/exercise', payload)
  return mapExerciseLog(data)
}

export const getExercises = async (date) => {
  const params = {}
  const maybeDate = formatDateForQuery(date, { optional: true })
  if (maybeDate) {
    params.date = maybeDate
  }
  const { data } = await apiClient.get('/exercise', { params })
  return data.map(mapExerciseLog)
}

export const deleteExercise = async (exerciseLogId) => {
  await apiClient.delete(`/exercise/${exerciseLogId}`)
}

export const logWeight = async (weight, date) => {
  if (weight === undefined || weight === null) {
    throw new Error('Weight is required')
  }
  const payload = {
    weight: Number(weight)
  }
  const maybeDate = formatDateForQuery(date, { optional: true })
  if (maybeDate) {
    payload.date = maybeDate
  }
  const { data } = await apiClient.post('/weight', payload)
  return mapWeightLog(data)
}

export const getWeightLogs = async ({ start, end } = {}) => {
  const params = {}
  const maybeStart = formatDateForQuery(start, { optional: true })
  if (maybeStart) {
    params.start = maybeStart
  }
  const maybeEnd = formatDateForQuery(end, { optional: true })
  if (maybeEnd) {
    params.end = maybeEnd
  }
  const { data } = await apiClient.get('/weight', { params })
  return data.map(mapWeightLog)
}


export const deleteWeightLog = async (weightLogId) => {
  await apiClient.delete(`/weight/${weightLogId}`)
}

// --- Added for FoodScanner.js compatibility ---
// Analyze food image from base64 string
export const analyzeFoodImage = async (imageBase64) => {
  // Assuming backend expects base64 string in 'image' field
  const { data } = await apiClient.post('/meals/analyze-image', {
    image: imageBase64
  })
  return data
}

// Search food by query string
export const searchFood = async (query) => {
  const { data } = await apiClient.get('/meals/search', {
    params: { q: query }
  })
  return data.results || data
}

// Log meal from object (used in FoodScanner.js)
export const logMeal = async (mealObj) => {
  // This assumes the backend accepts a generic meal object
  const { data } = await apiClient.post('/meals', mealObj)
  return data
}
