# CallTuneAI Player - Mobile App

A React Native mobile app built with Expo for playing AI-generated predator calling sounds. This app serves as a free lead magnet to collect verified emails for the CallTuneAI ecosystem.

## 🚀 Features

- **Audio Playback**: High-quality audio playback with loop controls
- **User Authentication**: Email/password registration and login with Supabase
- **Offline Capability**: Works offline after initial login
- **Sound Library**: Upload and manage predator calling sounds
- **User Settings**: Customizable playback and app preferences
- **Trial System**: 30-day trial with verification tracking

## 🛠 Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router 4.0.17
- **Backend**: Supabase (Auth, Database)
- **Audio**: Expo AV
- **Storage**: AsyncStorage for offline data
- **UI**: Custom components with Lucide React Native icons

## 📱 Setup Instructions

### 1. Environment Configuration

Create a `.env` file in the root directory:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. Configure email templates in Supabase Auth settings
4. Update the environment variables with your Supabase credentials

### 3. Installation

```bash
npm install
```

### 4. Development

```bash
npm run dev
```

## 🗄 Database Schema

### Users Table
- User profiles with trial tracking
- Email verification status
- Trial expiration management

### User Settings Table
- Playback preferences
- App configuration
- Bluetooth and audio settings

## 🔐 Authentication Flow

1. **Registration**: Email/password with metadata collection
2. **Email Verification**: Required before app access
3. **Login**: Session management with offline capability
4. **Password Reset**: Email-based password recovery

## 📱 App Structure

```
app/
├── _layout.tsx              # Root layout with auth routing
├── (tabs)/                  # Main tab navigation
│   ├── index.tsx           # Sound library
│   ├── upload.tsx          # Sound upload
│   ├── settings.tsx        # User settings
│   └── about.tsx           # App information
└── auth/                   # Authentication screens
    ├── register.tsx        # User registration
    ├── login.tsx           # User login
    ├── forgot-password.tsx # Password reset
    ├── verify.tsx          # Email verification
    └── reset.tsx           # Password reset confirmation
```

## 🎵 Audio Features

- **High-Quality Playback**: Enhanced audio processing
- **Loop Controls**: Seamless audio looping
- **Volume Management**: System volume integration
- **Offline Playback**: Local audio file management

## 🔧 Configuration

### Supabase Environment Variables
- `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### App Configuration
- Trial period: 30 days (configurable in database)
- Email verification: Required for app access
- Offline mode: Available after initial login

## 🚀 Deployment

This app is designed for deployment via:
- **Expo Application Services (EAS)**
- **App Store** (iOS)
- **Google Play Store** (Android)

## 📄 License

© 2025 CallTuneAI / SaaSAI Holdings LLC. All rights reserved.

## 🆘 Support

For technical support or questions:
- Email: support@calltuneai.com
- Website: https://calltuneai.com

---

**Note**: This app requires a valid Supabase project with the provided schema. Ensure all environment variables are properly configured before running the application.