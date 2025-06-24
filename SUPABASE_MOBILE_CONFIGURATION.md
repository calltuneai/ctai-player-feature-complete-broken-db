# Supabase Mobile App Configuration

## The Correct Mobile App Flow

For a proper mobile app experience, email verification should work like this:

1. **User registers** in the mobile app
2. **Verification email** is sent with a deep link (`calltuneai://auth/verify`)
3. **User clicks email link** → Opens directly in the mobile app
4. **App shows verification success** → User can immediately sign in
5. **No website redirect needed**

## Current Configuration Issues

The current setup is sending users to the website first, which creates unnecessary friction. Here's how to fix it:

## Supabase Configuration

### 1. Update Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:

**Site URL:**
```
calltuneai://
```

**Redirect URLs:**
```
calltuneai://auth/verify
calltuneai://auth/reset
calltuneai://auth/*
https://calltuneai.com/auth/verify
https://calltuneai.com/auth/reset
http://localhost:8081/auth/*
```

### 2. Email Template Configuration

Update your email templates to mention the mobile app experience:

**Confirm Signup Template:**
```html
<h2>Welcome to CallTuneAI Player!</h2>
<p>Thanks for signing up! Click the link below to verify your email and start using the app:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #0496FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email & Open App</a></p>
<p>This link will open directly in the CallTuneAI Player app.</p>
<p><small>If you didn't create an account, you can safely ignore this email.</small></p>
```

**Reset Password Template:**
```html
<h2>Reset Your CallTuneAI Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #0496FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password in App</a></p>
<p>This link will open directly in the CallTuneAI Player app.</p>
<p><small>If you didn't request this, you can safely ignore this email.</small></p>
```

## How This Improves the Experience

### Before (Current):
1. User registers in app
2. Email link goes to website
3. User sees website verification page
4. User clicks "Start Using App" 
5. User goes back to app to sign in

### After (Fixed):
1. User registers in app
2. Email link opens directly in app
3. App shows verification success
4. User can immediately sign in

## Platform-Specific Behavior

The updated code now handles this correctly:

- **Mobile App**: Uses `calltuneai://auth/verify` deep links
- **Web Preview**: Falls back to website URLs for development
- **Development**: Supports localhost URLs for testing

## Testing the Fix

1. Update Supabase redirect URLs as shown above
2. Register with a new email address
3. Check that email link opens directly in the app
4. Verify that the in-app verification screen appears
5. Confirm user can sign in immediately after verification

This creates a much smoother, more professional mobile app experience without unnecessary website redirects.