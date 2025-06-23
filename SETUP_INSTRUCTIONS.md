# CallTuneAI Player - Supabase Setup Instructions

## 🎯 Quick Setup Guide

Follow these steps to connect your CallTuneAI Player app to a new Supabase instance.

## 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `calltuneai-player`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for project initialization (2-3 minutes)

## 2. Get Your Credentials

Once your project is ready:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **anon public** key (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Update Environment Variables

In your Bolt project, update the `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Replace the placeholder values with your actual Supabase credentials.**

## 4. Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration
5. Verify tables were created in **Table Editor**

## 5. Configure Email Templates (Optional)

For better user experience, customize email templates:

1. Go to **Authentication** → **Email Templates**
2. Customize these templates:
   - **Confirm signup**: Welcome message with verification link
   - **Reset password**: Password reset instructions
   - **Magic link**: If using magic links (optional)

### Sample Email Templates

**Confirm Signup Template:**
```html
<h2>Welcome to CallTuneAI Player!</h2>
<p>Thanks for signing up! Please click the link below to verify your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Verify Email Address</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

**Reset Password Template:**
```html
<h2>Reset Your CallTuneAI Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

## 6. Configure Authentication Settings

1. Go to **Authentication** → **Settings**
2. Configure these settings:
   - **Site URL**: `https://calltuneai.com` (or your domain)
   - **Redirect URLs**: Add your app's redirect URLs if needed
   - **Email Confirmation**: Ensure this is **enabled**
   - **Double Confirm Email Changes**: **Enabled** (recommended)

## 7. Test the Connection

1. Start your Expo development server: `npm run dev`
2. Try registering a new account
3. Check your email for verification
4. Verify login works after email confirmation

## 🔍 Verification Checklist

- [ ] Supabase project created and initialized
- [ ] Environment variables updated in `.env`
- [ ] Database migration executed successfully
- [ ] Tables visible in Supabase Table Editor:
  - [ ] `users` table
  - [ ] `user_settings` table
- [ ] Email templates configured (optional but recommended)
- [ ] Authentication settings configured
- [ ] Test registration and login working

## 🚨 Troubleshooting

### Common Issues:

**"Missing Supabase environment variables" error:**
- Ensure `.env` file exists in project root
- Verify variable names match exactly: `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Expo development server after updating `.env`

**Database connection errors:**
- Verify Supabase project is fully initialized
- Check that migration was executed successfully
- Ensure RLS policies are enabled (handled by migration)

**Email verification not working:**
- Check Supabase Auth logs for errors
- Verify email templates are configured
- Check spam folder for verification emails

**Registration fails:**
- Check Supabase Auth logs in dashboard
- Verify user metadata is being saved correctly
- Ensure triggers are working (check Functions tab)

## 📞 Need Help?

If you encounter issues:

1. Check Supabase Dashboard → **Logs** for error details
2. Verify all migration steps completed successfully
3. Test with a fresh email address
4. Check browser console for JavaScript errors

## 🎉 You're Ready!

Once setup is complete, your CallTuneAI Player app will have:
- ✅ User registration and authentication
- ✅ Email verification system
- ✅ Offline capability after login
- ✅ User settings persistence
- ✅ Trial tracking system

The app is now ready for development and testing!