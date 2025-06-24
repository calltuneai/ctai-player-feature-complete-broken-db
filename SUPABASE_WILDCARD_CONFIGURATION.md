# Complete Supabase URL Configuration with Wildcards

## Redirect URLs Configuration

In your Supabase Dashboard → **Authentication** → **URL Configuration**, add these redirect URLs:

### Production URLs
```
https://calltuneai.com/auth/verify
https://calltuneai.com/auth/reset
https://calltuneai.com/auth/*
```

### Development URLs
```
http://localhost:3000/auth/*
http://localhost:8081/auth/*
http://127.0.0.1:3000/auth/*
```

### Mobile Deep Links
```
calltuneai://auth/verify
calltuneai://auth/reset
calltuneai://auth/*
calltuneai://*
```

### Expo Development URLs (if needed)
```
exp://localhost:8081/--/auth/*
exp://127.0.0.1:8081/--/auth/*
```

## Site URL
```
https://calltuneai.com
```

## Wildcard Patterns Explained

- `https://calltuneai.com/auth/*` - Matches any auth route on your website
- `calltuneai://*` - Matches any deep link to your app
- `http://localhost:*/auth/*` - Matches development servers on any port

## Email Template Configuration

### Confirm Signup Template
```html
<h2>Welcome to CallTuneAI Player!</h2>
<p>Thanks for signing up! Please verify your email to start using the app:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #0496FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Email Address</a></p>
<p>After verification, you can sign in to the CallTuneAI Player app.</p>
<p><small>If you didn't create an account, you can safely ignore this email.</small></p>
```

### Reset Password Template
```html
<h2>Reset Your CallTuneAI Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #0496FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a></p>
<p><small>If you didn't request this, you can safely ignore this email.</small></p>
```

## How This Solves Your Issues

1. **No More Localhost Redirects**: All verification emails will go to your website
2. **Flexible Development**: Wildcards handle different development setups
3. **Mobile Deep Links**: Optional deep linking back to the app
4. **Professional Experience**: Users see your branded pages

## Testing Checklist

- [ ] Update Supabase redirect URLs with wildcards
- [ ] Update email templates with your branding
- [ ] Test registration with new email
- [ ] Verify email goes to calltuneai.com/auth/verify
- [ ] Test that user can sign in after verification
- [ ] Test password reset flow

## Priority Order

Supabase will try to match URLs in the order they're listed, so put your production URLs first:

1. `https://calltuneai.com/auth/*` (production)
2. `calltuneai://auth/*` (mobile deep links)
3. `http://localhost:*/auth/*` (development)

This ensures production users always get the website experience while allowing development flexibility.