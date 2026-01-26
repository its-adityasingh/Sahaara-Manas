# Supabase Setup Guide

## Quick Setup

The app is now configured to run even without Supabase credentials, but you'll need to configure Supabase to use authentication features.

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase](https://supabase.com/) and sign in (or create an account)
2. Create a new project or select an existing one
3. Wait for the project to finish setting up (takes 1-2 minutes)
4. Go to **Project Settings** → **API**
5. Copy the following:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (found under "Project API keys")

### Step 2: Update Your .env File

Open the `.env` file in the project root and replace the placeholder values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Important:** Replace `your-project-id` and `your-anon-key-here` with your actual values from Supabase.

### Step 3: Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Run the migration files in order:
   - Copy and paste the contents of `supabase/migrations/20251224094249_5900648a-556e-406d-8c66-4767fe601a98.sql`
   - Click "Run" to execute
   - Then copy and paste the contents of `supabase/migrations/20251225000000_update_profile_trigger.sql`
   - Click "Run" to execute

### Step 4: Configure Email Settings (Optional)

For easier testing, you can disable email confirmation:

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Under "Email Auth", toggle off **"Confirm email"** (for development only)
3. For production, keep email confirmation enabled

### Step 5: Restart Development Server

After updating the `.env` file:

1. Stop the current dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. The app should now connect to Supabase successfully

## Verification

After setup, you should be able to:
- ✅ Sign up with email and password
- ✅ Log in with your credentials
- ✅ See your profile in the dashboard

## Troubleshooting

### "Failed to fetch" Error
- Check that your `.env` file has the correct values
- Ensure your Supabase project is active (not paused)
- Verify your internet connection
- Restart the dev server after changing `.env`

### "Invalid credentials" Error
- Make sure you've run the database migrations
- Check that email confirmation is disabled (if you disabled it)
- Try creating a new account

### App Still Shows Configuration Warning
- Make sure you saved the `.env` file
- Restart the development server
- Check that the values don't have extra spaces or quotes

## Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your Supabase project is active
3. Make sure all migrations have been run
4. Check that RLS (Row Level Security) policies are enabled

