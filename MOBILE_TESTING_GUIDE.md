# Mobile App Integration Testing Guide

## Setup Instructions

### 1. Prerequisites
- Backend running on `http://127.0.0.1:8000` (confirmed working ✅)
- Expo Go app installed on your physical device OR use iOS/Android simulator
- Mobile app running: `npm start` from `/cai_mobile_app`

### 2. Backend Status
✅ **All backend endpoints verified and working:**
- Session creation: `/auth/anonymous-session`
- Water logging: `POST /water`, `GET /water?date=`
- Water history: Retrievable via `/water?date=`
- Meal creation: `POST /meals` (structured)
- Image scanning: `POST /meals/scan`
- Meal persistence: `POST /meals/from-image`
- Meal history: `GET /meals/history?date=`
- Daily summary: `GET /summary/day?date=`
- Exercise logging: `POST /exercise`

### 3. Mobile App Features (All Implemented)

#### Dashboard Screen
- **Feature**: Displays daily summary (calories, macros, water, exercise)
- **Integration**: `summaryApi.getDailySummary(date)`
- **Status**: ✅ Ready to test
- **Testing**: Navigate to Dashboard tab, verify summary loads with real data

#### Water Tracker Screen
- **Feature**: Log water intake with quick buttons (250ml, 500ml, 750ml, 1000ml) or custom
- **Integration**: `waterApi.logWater(amount)`
- **Status**: ✅ Ready to test
- **Testing**: 
  1. Click a quick button (e.g., 250ml)
  2. Verify success alert appears
  3. Navigate to Dashboard to see updated water total

#### Exercise Tracker Screen
- **Feature**: Log exercise with type, duration, and intensity
- **Integration**: `exerciseApi.logExercise(data)`
- **Status**: ✅ Ready to test
- **Testing**:
  1. Select exercise type (e.g., Running)
  2. Enter duration (e.g., 30 minutes)
  3. Select intensity (Light/Moderate/Vigorous)
  4. Click "Log Exercise"
  5. Verify success alert
  6. Check Dashboard for updated exercise total

#### Scan Screen
- **Feature**: Pick image from library, scan for food items, save as meal
- **Integrations**: 
  - `uploadImageForScan(file)` → returns parsed foods
  - `persistMealFromImage(file)` → saves as meal
- **Status**: ✅ Ready to test
- **Testing**:
  1. Click "Pick Image"
  2. Select a photo from your library
  3. Wait for AI parsing (shows food items with calories)
  4. Click "Save Scan as Meal" to persist
  5. Verify meal count increases in Dashboard

#### Settings Screen
- **Feature**: View app info, user ID, health goals, logout
- **Integration**: Session management via `clearSession()`, `getSession()`
- **Status**: ✅ Ready to test
- **Testing**:
  1. View current User ID and session info
  2. Review health goals
  3. Click Logout (confirm modal appears)
  4. Verify session cleared and app prompts new session on next action

---

## End-to-End Test Scenarios

### Scenario 1: Complete Daily Tracking Flow
1. **Open Dashboard** → See initial empty state (0 calories, 0 water, etc.)
2. **Go to Water** → Log 250ml water
3. **Go to Exercise** → Log 30 min moderate running
4. **Go to Scan** → Take/select food photo, view parsed foods, save as meal
5. **Return to Dashboard** → Verify all data updated:
   - Total calories ≈ parsed meal calories
   - Total macros reflected
   - Water: 250ml
   - Exercise: 30 min

### Scenario 2: Multiple Water Logs
1. **Water tab** → Log 250ml
2. **Alert confirms** → Log another 500ml
3. **Alert confirms** → Log custom 200ml
4. **Dashboard** → Total water should show ~950ml

### Scenario 3: Session Persistence
1. **Log some data** (water, exercise, meal)
2. **Settings** → View User ID
3. **Close app** (or kill app process)
4. **Reopen app** → Session should auto-restore (same User ID)
5. **Dashboard** → Previous data visible

### Scenario 4: Logout & New Session
1. **Settings** → Click Logout
2. **Confirm logout** → Session cleared
3. **Water tab** → Try logging water → New session created
4. **Settings** → User ID should be different from before

---

## Troubleshooting

### Issue: Backend connection fails
- **Solution**: Verify backend is running (`http://127.0.0.1:8000`)
- **Check**: `curl http://127.0.0.1:8000/auth/anonymous-session -X POST`

### Issue: Image picker doesn't work
- **Solution**: Grant camera/library permissions when prompted
- **Check**: iOS simulator may need Settings → Privacy → Photos permission enabled

### Issue: Scanned food shows incorrect calories
- **Solution**: AI model depends on `OPENAI_API_KEY` env var on backend
- **Check**: Backend will use fallback nutrition lookup if no OpenAI key

### Issue: Session not persisting
- **Solution**: AsyncStorage may need permission on Android
- **Check**: App permissions in device settings

---

## Verification Checklist

- [ ] Dashboard loads and displays summary
- [ ] Water tracker logs amounts correctly
- [ ] Water totals update in Dashboard
- [ ] Exercise tracker accepts all inputs
- [ ] Exercise totals appear in Dashboard
- [ ] Scan screen can pick images
- [ ] Scanned foods display with calories
- [ ] Save as meal persists food
- [ ] Meal count increases in Dashboard
- [ ] Settings shows current session User ID
- [ ] Logout clears session
- [ ] New session created after logout
- [ ] All navigation tabs work smoothly
- [ ] No console errors or warnings (check Expo logs)

---

## Next Steps After Testing

1. **Production Build**: `expo build:ios` or `expo build:android`
2. **Deploy Backend**: Push to Vercel (see `DEPLOY_VERCEL.md`)
3. **Update Backend URL**: Point mobile app to production backend
4. **Add CI/CD**: Set up GitHub Actions for automated testing
5. **Publish**: Submit to App Store / Google Play

