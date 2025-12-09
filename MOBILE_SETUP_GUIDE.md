# CalAI Mobile Setup Guide

## 🎯 Getting Started with Expo

Your CalAI app is now ready to run on iOS and Android devices using Expo Go!

### Prerequisites
- Node.js and npm
- Expo Go app installed on your iPhone (App Store) or Android (Play Store)
- Your backend running (either locally or deployed)

---

## 📱 Setup Steps

### 1. **Install Dependencies**
```bash
cd cai_mobile_app
npm install
```

### 2. **Configure Backend URL**

Edit `src/services/api.js` and update the backend URL:

**Option A: Local Network (Same WiFi)**
```javascript
const BACKEND_URL = 'http://192.168.1.X:8000'  // Replace with your Mac's IP
```

Get your IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Option B: Deployed Backend**
```javascript
const BACKEND_URL = 'https://your-backend-domain.com'
```

**Option C: Using ngrok (for quick testing)**
```bash
# In backend terminal
ngrok http 8000
# Use the https URL in api.js
```

### 3. **Start the Expo Server**
```bash
npm start
```

You'll see a terminal with a QR code.

---

## 📲 Running on Your Device

### **iOS (iPhone)**
1. Open Camera app
2. Point at the QR code from terminal
3. Tap the notification to open in Expo Go

### **Android (Android Phone)**
1. Open Expo Go app
2. Scan QR code from terminal
3. App will load automatically

### **Web (For Testing)**
```bash
npm run web
```

---

## 🖥️ Running Your Backend

Make sure your backend is running:

```bash
cd "neocal_backend_ai_0336 2"
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--host 0.0.0.0` allows devices on your network to connect.

---

## 📱 Mobile App Features

### **Dashboard**
- View daily summary of calories, protein, carbs, fat
- Water intake tracking
- Exercise minutes logged
- Pull-to-refresh to update data

### **Water Tracker**
- Quick add buttons (250ml, 500ml, 750ml, 1000ml)
- Custom amount entry
- Instant feedback

### **Exercise Tracker**
- Select exercise type
- Enter duration
- Choose intensity level
- Log exercise

### **Settings**
- View user session
- Check app version
- Manage health data goals
- Logout functionality

---

## 🔧 Troubleshooting

### **App Won't Connect to Backend**

1. **Check IP Address**
   ```bash
   ifconfig
   # Use the IP from en0 (WiFi) interface
   ```

2. **Verify Network**
   - Phone and Mac on same WiFi
   - Backend listening on `0.0.0.0`

3. **Test Connection**
   ```bash
   # From phone's browser, try:
   http://192.168.1.X:8000/docs
   ```

4. **Use ngrok**
   ```bash
   ngrok http 8000
   # Use generated https URL
   ```

### **Port Already in Use**
```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

### **Module Not Found Errors**
```bash
npm install
npx expo install @react-native-async-storage/async-storage
```

### **Hot Reload Not Working**
- Edit code in editor
- Press `r` in terminal to reload
- Or shake device and select "Reload"

---

## 🚀 Advanced Options

### **Build APK/IPA (Production)**
```bash
# Android APK
npx eas build --platform android

# iOS IPA
npx eas build --platform ios
```

Requires Expo account and EAS setup.

### **Deploy to Cloud**
Deploy your backend to:
- Heroku
- Railway
- Render
- DigitalOcean
- AWS

Then update API URL in `src/services/api.js`

### **Environment Variables**
Create `.env` file:
```
EXPO_PUBLIC_BACKEND_URL=https://your-backend.com
```

---

## 📱 Device Requirements

- **iOS**: iPhone 5s or later
- **Android**: Android 5.0+
- **Network**: Must have internet connection
- **Storage**: ~100MB free space

---

## ✅ Verification Checklist

- [ ] Backend running and accessible
- [ ] Expo CLI installed globally
- [ ] `npm install` completed
- [ ] Backend URL configured in `api.js`
- [ ] Expo Go app installed on device
- [ ] Phone and Mac on same WiFi
- [ ] Can scan QR code and see app load
- [ ] Can create session (should see data on dashboard)
- [ ] Can log water intake
- [ ] Can log exercise

---

## 📚 Next Steps

1. Test basic functionality on phone
2. Log some data
3. Check dashboard updates
4. Modify UI as needed
5. Consider deploying backend to cloud
6. Build for App Store/Play Store (optional)

---

## 🆘 Getting Help

- Check `src/services/api.js` for API configuration
- Review `app/(tabs)/` for screen implementations
- Check terminal logs for error messages
- Shake device and tap "Open JS Debugger" for debugging

---

## 🎉 You're All Set!

Your CalAI app is now running on mobile! Start tracking your health metrics right away.

Happy coding! 🚀
