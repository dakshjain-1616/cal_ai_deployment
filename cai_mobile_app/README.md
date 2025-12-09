# CalAI Mobile App - React Native with Expo

A production-ready health tracking mobile application for iOS and Android using React Native and Expo.

## ✨ Features

- **📊 Dashboard**: Real-time health metrics (calories, protein, water, exercise)
- **💧 Water Tracker**: Quick water logging with preset buttons
- **🏃 Exercise Logger**: Track workouts with type, duration, and intensity
- **⚙️ Settings**: User preferences, session management, logout
- **🔄 Pull-to-Refresh**: Updated data with gesture
- **📱 Responsive Design**: Optimized for all device sizes

## 🚀 Quick Start

### Prerequisites
- Node.js and npm
- Expo Go app (free) on your iPhone/Android
- Backend running (FastAPI)

### Setup
```bash
cd cai_mobile_app
npm install
npm start
```

### Run on Device
1. **iPhone**: Open Camera → Scan QR code from terminal
2. **Android**: Open Expo Go → Scan QR code from terminal

## 🔧 Backend Configuration

Edit `src/services/api.js` to set your backend URL:

```javascript
// Local network (same WiFi)
const BACKEND_URL = 'http://YOUR_MAC_IP:8000'

// Or use ngrok for quick testing
// const BACKEND_URL = 'https://your-ngrok-url.ngrok.io'

// Or deployed backend
// const BACKEND_URL = 'https://your-backend-domain.com'
```

Get your Mac's IP:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

## 📁 Project Structure

```
cai_mobile_app/
├── app/(tabs)/
│   ├── index.tsx        # Dashboard
│   ├── water.tsx        # Water Tracker
│   ├── exercise.tsx     # Exercise Logger
│   └── settings.tsx     # Settings
├── src/services/
│   └── api.js           # Backend API client
├── start-mobile.sh      # Quick start script
└── package.json
```

## 📱 Screens

### Dashboard
Shows daily summary with automatic refresh

### Water Tracker
- Quick-add: 250ml, 500ml, 750ml, 1000ml
- Custom amount
- Instant confirmation

### Exercise Logger
- 8 exercise types
- Duration in minutes
- 3 intensity levels
- Instant logging

### Settings
- Session info
- User preferences
- Health goals
- Logout option

## 🔍 Troubleshooting

**Can't connect to backend?**
1. Verify backend is running: `python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`
2. Check IP address matches
3. Phone and Mac on same WiFi
4. Test in browser: `http://YOUR_IP:8000/docs`

**Port already in use?**
```bash
python3 -m uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

**Module errors?**
```bash
npm install
npx expo install @react-native-async-storage/async-storage
```

## 🎯 Next Steps

1. ✅ Run app on device
2. ⬜ Test water/exercise logging
3. ⬜ Customize colors and theme
4. ⬜ Deploy backend to cloud
5. ⬜ Build for App Store/Play Store

## 📚 Resources

- [Expo Docs](https://docs.expo.dev)
- [React Native](https://reactnative.dev)
- [Backend Guide](../MOBILE_SETUP_GUIDE.md)

---

**For detailed setup guide, see [MOBILE_SETUP_GUIDE.md](../MOBILE_SETUP_GUIDE.md)**

---

**Happy Tracking! 🚀**

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
