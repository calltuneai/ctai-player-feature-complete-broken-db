# Supabase Configuration Fix for Email Verification

## Problem
Email verification links are redirecting to `localhost:3000` instead of your beautiful verification page at `https://calltuneai.com/auth/verify`.

## Solution
Update your Supabase Auth settings to use your existing website verification page.

## Steps to Fix

### 1. Update Supabase Auth Settings

In your Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Update these settings:

**Site URL:**
```
https://calltuneai.com
```

**Redirect URLs:**
```
https://calltuneai.com/auth/verify
calltuneai://auth/verify
http://localhost:8081/auth/verify
```

### 2. Update Email Templates (Optional)

In **Authentication** → **Email Templates**, you can customize the verification email to mention your app:

**Confirm Signup Template:**
```html
<h2>Welcome to CallTuneAI Player!</h2>
<p>Thanks for signing up for CallTuneAI Player! Please click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>Once verified, you can download and start using the CallTuneAI Player app.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

### 3. How It Will Work

**After the fix:**
1. User registers in the mobile app
2. Verification email is sent with link to `https://calltuneai.com/auth/verify`
3. User clicks link and sees your beautiful verification page
4. User clicks "Start Using the App" button
5. If on mobile, it can deep link back to the app
6. User can then sign in to the mobile app

### 4. Optional: Add Deep Link to Website

You could add a deep link button to your website verification page:

```html
<a href="calltuneai://auth/verified" class="app-button">
  Open CallTuneAI Player App
</a>
```

This would automatically open the mobile app after verification (if installed).

## Benefits of This Approach

✅ **Professional Experience**: Users see your branded verification page
✅ **Cross-Platform**: Works for web and mobile users
✅ **Consistent Branding**: Matches your website design
✅ **No Development Needed**: Uses your existing page
✅ **SEO Friendly**: Verification page is on your domain

## Testing

1. Update Supabase settings as shown above
2. Register with a new email address
3. Check that verification link goes to `calltuneai.com/auth/verify`
4. Verify the user can then sign in to the mobile app

The localhost redirect issue will be completely resolved, and users will have a much better verification experience!