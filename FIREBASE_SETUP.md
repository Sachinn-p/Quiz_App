# Firebase Authentication Setup

## Configuration Steps

1. **Get Firebase Credentials from Firebase Console:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `Quiz-App-Auth` 
   - Go to Project Settings (gear icon) > General
   - Scroll down to "Your apps" section
   - If no web app exists, click "Add app" and select Web (</>) icon
   - Copy the Firebase configuration values

2. **Update the `.env` file** in `/frontend` directory with your Firebase credentials:
   ```
   VITE_API_URL=http://127.0.0.1:8000

   # Firebase Configuration
  
   ```

3. **Enable Email/Password Authentication:**
   - In Firebase Console, go to Authentication > Sign-in method
   - Click on "Email/Password"
   - Enable it and save

4. **Configure Email Templates (for password reset):**
   - Go to Authentication > Templates
   - Click on "Password reset"
   - Customize the email template as needed
   - Save changes

5. **Install Dependencies:**
   ```bash
   cd frontend
   npm install firebase
   ```

6. **Start the Application:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   source ../venv/bin/activate
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

## Features Implemented

- ✅ Email/Password Registration
- ✅ Email/Password Login
- ✅ Password Reset via Email
- ✅ Protected Routes (requires authentication)
- ✅ User Session Management
- ✅ Logout Functionality
- ✅ Display User Info in Header

## Routes

- `/login` - Sign in page
- `/register` - Sign up page
- `/forgot-password` - Password reset page
- `/` - Quiz page (protected, requires authentication)
- `/quiz` - Quiz page (protected, requires authentication)

## Security Notes

- Never commit your `.env` file with actual credentials to version control
- Firebase API keys are safe to use in client-side code (they're meant to identify your project)
- Add your actual domain to Firebase authorized domains in production
- Keep your `.env` file in `.gitignore`
