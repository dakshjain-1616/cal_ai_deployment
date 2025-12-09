# 🎉 CalAI Mobile App - Complete Setup & Launch Guide

## ✅ What's Been Set Up

Your CalAI application is now ready to run on iOS and Android devices via Expo! Here's what we've created:

### 📦 New Mobile App
- **Location**: `cai_mobile_app/`
- **Framework**: React Native + Expo
- **Status**: ✅ Ready to run

### 📱 Screens Implemented
1. **Dashboard** (`app/(tabs)/index.tsx`)
   - Daily health summary
   - Pull-to-refresh
   - Real-time data from backend

2. **Water Tracker** (`app/(tabs)/water.tsx`)
   - Quick-add buttons (250, 500, 750, 1000ml)
   - Custom amount input
   - Instant logging

3. **Exercise Logger** (`app/(tabs)/exercise.tsx`)
   - 8 exercise types
   - Duration input
   - 3 intensity levels

4. **Settings** (`app/(tabs)/settings.tsx`)
   - User session info
   - Health goal management
   - Logout functionality

### 🔗 Backend Integration
- **API Client**: `src/services/api.js`
- **Authentication**: Automatic anonymous session
- **Storage**: AsyncStorage for local persistence
- **Network**: Axios HTTP client

---

## 🚀 Getting Started (3 Steps)

### Step 1: Configure Backend URL

Edit `cai_mobile_app/src/services/api.js` - Line 7:

**Option A: Same WiFi Network (Easiest)**
```javascript
const BACKEND_URL = 'http://192.168.1.100:8000'  // Replace with your Mac's IP
```

Get your IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Option B: ngrok (Cloud Tunnel)**
```bash
# Terminal 1: Start ngrok
ngrok http 8000

# Copy the HTTPS URL and use in api.js
const BACKEND_URL = 'https://xxxx-xxxx-ngrok.io'
```

**Option C: Deployed Backend**
```javascript
const BACKEND_URL = 'https://your-backend-domain.com'
```

### Step 2: Start Backend

```bash
cd "neocal_backend_ai_0336 2"
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
Application startup complete
```

### Step 3: Start Mobile App

```bash
cd cai_mobile_app
npm start
```

Or use the quick start script:
```bash
./start-mobile.sh
```

---

## 📲 Running on Your Device

### **iPhone (Easiest)**
1. Open **Camera** app on your iPhone
2. Point camera at the **QR code** shown in terminal
3. Tap the notification that appears
4. Tap "Open in Expo Go"
5. App loads on your device! 🎉

### **Android**
1. Open **Expo Go** app (download free from Play Store)
2. Tap **Scan QR Code**
3. Point camera at QR code in terminal
4. App loads on your device! 🎉

### **Web (For Testing)**
```bash
npm run web
```
Opens `http://localhost:3000` in your browser

---

## 📋 Checklist Before Launching

- [ ] Backend URL configured in `src/services/api.js`
- [ ] Backend is running (`npm start` shows "Application startup complete")
- [ ] Expo Go app installed on phone
- [ ] Phone and Mac on **same WiFi network**
- [ ] Terminal showing Expo QR code
- [ ] Can scan QR code without errors

---

## 🧪 Testing the App

### 1. Check Dashboard
- Should load and show today's data
- Pull down to refresh

### 2. Log Water
- Tap "Water" tab
- Tap a quick-add button (e.g., 500ml)
- Should see "Success" message

### 3. Log Exercise
- Tap "Exercise" tab
- Select exercise type
- Enter duration
- Choose intensity
- Tap "Log Exercise"

### 4. View Updates
- Go back to Dashboard
- Pull to refresh
- New data should appear

---

## 🔧 Troubleshooting

### ❌ "Connection Refused" Error

**Problem**: App can't reach backend

**Solution**:
1. Check IP address:
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```
2. Update `src/services/api.js` with correct IP
3. Verify backend is running
4. Phone and Mac on same WiFi

### ❌ "Module Not Found" Error

**Problem**: Missing dependencies

**Solution**:
```bash
cd cai_mobile_app
npm install
npx expo install @react-native-async-storage/async-storage
```

### ❌ Port 8000 Already in Use

**Problem**: Another app is using port 8000

**Solution**:
```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
# Then update BACKEND_URL to port 8001
```

### ❌ QR Code Won't Scan

**Problem**: Camera issues or wrong code

**Solution**:
1. Make sure terminal is in focus
2. Terminal not minimized
3. QR code visible and in focus
4. Try manual connection:
   - Copy connection string from terminal
   - Paste in Expo Go

### ❌ App Crashes on Startup

**Problem**: Backend connection issue

**Solution**:
1. Check backend logs
2. Verify API URL is correct
3. Test backend: `curl http://192.168.1.X:8000/docs`
4. Try ngrok instead

---

## 📱 Device Requirements

| Requirement | iOS | Android |
|---|---|---|
| **OS Version** | 13.0+ | 5.0+ |
| **Device** | iPhone 5s+ | Any Android device |
| **Storage** | 100MB | 100MB |
| **Network** | WiFi or cellular | WiFi or cellular |
| **Expo Go** | Free app | Free app |

---

## 🎨 Customization

### Change Colors
Edit `app/(tabs)/_layout.tsx`:
```tsx
tabBarActiveTintColor: '#2196F3',    // Change blue
tabBarInactiveTintColor: '#999',     // Change gray
```

### Change App Name
Edit `app.json`:
```json
{
  "expo": {
    "name": "My Health App",
    "slug": "my-health-app"
  }
}
```

### Add More Screens
1. Create new file: `app/(tabs)/meals.tsx`
2. Add to `_layout.tsx`:
```tsx
<Tabs.Screen
  name="meals"
  options={{
    title: 'Meals',
    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="food" size={24} color={color} />
  }}
/>
```

---

## 🔄 Development Workflow

### Hot Reload
While `npm start` is running:
1. Edit and save a file
2. Press `r` in terminal
3. App reloads on device

### Debugging
1. Shake device
2. Tap "Open JS Debugger"
3. Browser DevTools opens
4. Use Chrome DevTools to debug

### View Logs
All logs appear in your terminal while running `npm start`

---

## 🚀 Advanced: Deploy Backend to Cloud

### Option 1: Railway (Easiest)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Option 2: Heroku
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login and create app
heroku login
heroku create your-app-name

# Deploy
git push heroku main
```

### Option 3: Render
1. Push code to GitHub
2. Go to render.com
3. Create new Web Service
4. Connect GitHub repo
5. Deploy

Then update `src/services/api.js`:
```javascript
const BACKEND_URL = 'https://your-app-name.herokuapp.com'
```

---

## 📚 File Reference

| File | Purpose |
|---|---|
| `app/(tabs)/_layout.tsx` | Tab navigation setup |
| `app/(tabs)/index.tsx` | Dashboard screen |
| `app/(tabs)/water.tsx` | Water tracker screen |
| `app/(tabs)/exercise.tsx` | Exercise logger screen |
| `app/(tabs)/settings.tsx` | Settings screen |
| `src/services/api.js` | Backend API client |
| `package.json` | Dependencies |
| `app.json` | Expo configuration |
| `start-mobile.sh` | Quick start script |

---

## 🎯 Next Steps

### Immediate (Today)
- [ ] Configure backend URL
- [ ] Start backend
- [ ] Run on your phone
- [ ] Test basic features

### Short Term (This Week)
- [ ] Add meal logging screen
- [ ] Add weight tracking
- [ ] Customize colors/theme
- [ ] Deploy backend to cloud

### Medium Term (This Month)
- [ ] Deploy app to TestFlight (iOS)
- [ ] Deploy app to Play Store (Android)
- [ ] Add push notifications
- [ ] Add data visualization

### Long Term (Future)
- [ ] Apple Watch integration
- [ ] Wearable device sync
- [ ] AI meal recognition
- [ ] Social features

---

## 💡 Pro Tips

1. **Use ngrok for Remote Testing**
   - Works anywhere without local network
   - Great for demos and testing

2. **Check Backend Logs**
   - Terminal shows all API calls
   - Helps debug issues

3. **Use DevTools**
   - Shake device → Open JS Debugger
   - Use Chrome DevTools for debugging

4. **Test on Real Device**
   - Don't rely on simulator
   - Real network conditions matter

5. **Keep Backend URL Updated**
   - Different for local, ngrok, cloud
   - Don't commit API URLs to git

---

## 📖 Documentation

- [Full Mobile Setup Guide](../MOBILE_SETUP_GUIDE.md)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Guide](https://reactnative.dev)
- [Backend API Guide](../neocal_backend_ai_0336%202/README.md)

---

## 🆘 Getting Help

1. **Check Terminal Logs** - Most errors shown there
2. **Verify Network** - Phone and Mac on same WiFi
3. **Restart Everything** - Stop expo, backend, restart
4. **Check API URL** - Make sure it's correct in api.js
5. **Try ngrok** - More reliable than local IP

---

## 🎉 You're Ready!

Your CalAI mobile app is fully set up and ready to launch on your devices!

```bash
cd cai_mobile_app
npm start
# Scan QR code with your phone
# Happy tracking! 🚀
```

---

**Questions? Check the troubleshooting section above or review MOBILE_SETUP_GUIDE.md**

**Happy coding! 💻📱**
