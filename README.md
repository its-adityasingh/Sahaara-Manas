# Sahaara Gyaan - Your Learning Path

## About

Sahaara Gyaan is an inclusive digital learning platform designed to bridge the education gap in India. We provide quality education for every child, regardless of location, language, or ability.

## Features

- **Adaptive Learning**: Personalized content that adjusts to your learning style
- **Multilingual Support**: Learn in 12+ Indian languages
- **Offline Mode**: Download courses and learn without internet
- **Accessibility**: Built for students with diverse needs and abilities
- **Progress Tracking**: Track your learning journey with detailed analytics
- **AI-Powered Learning Plans**: Get personalized study plans based on your class and goals
- **Video Lessons**: Access comprehensive video playlists for all subjects
- **Dashboard**: View your progress, streaks, and recent lessons in one place

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/) or [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)

## Getting Started

### Step 1: Clone the Repository

```sh
git clone <YOUR_GIT_URL>
cd sahaara-your-learning-path-main
```

### Step 2: Install Dependencies

```sh
npm install
```

or if you're using yarn:

```sh
yarn install
```

### Step 3: Set Up Environment Variables

Create a `.env` file in the root directory of the project:

```sh
# Copy the example env file (if available) or create a new one
touch .env
```

Add the following environment variables to your `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

**How to get Supabase credentials:**

1. Go to [Supabase](https://supabase.com/) and create a new project (or use an existing one)
2. Navigate to your project settings
3. Go to the "API" section
4. Copy the "Project URL" and paste it as `VITE_SUPABASE_URL`
5. Copy the "anon/public" key and paste it as `VITE_SUPABASE_PUBLISHABLE_KEY`

### Step 4: Set Up Supabase Database

The project includes database migrations in the `supabase/migrations` folder. You need to run these migrations in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration files in order:
   - `20251224094249_5900648a-556e-406d-8c66-4767fe601a98.sql`
   - `20251225000000_update_profile_trigger.sql` (if exists)

Alternatively, if you have the Supabase CLI installed:

```sh
supabase db push
```

### Step 5: Start the Development Server

```sh
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

## Available Scripts

- `npm run dev` - Start the development server with hot-reloading
- `npm run build` - Build the project for production
- `npm run build:dev` - Build the project in development mode
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check for code issues

## How to Use

### 1. Sign Up / Login

- Navigate to the login page
- Create a new account or sign in with existing credentials
- During signup, you'll be asked to provide:
  - Your full name
  - Your class/grade level
  - Your preferred language

### 2. Dashboard

Once logged in, you'll see your personalized dashboard with:

- **Quick Stats**: Your current streak, lessons completed, study time, and best streak
- **Progress by Subject**: Visual progress bars showing your completion status for each subject
  - **Click on any subject** to navigate directly to that course
- **Recent Lessons**: List of your recently accessed lessons
  - **Click on any lesson** to continue learning from where you left off
- **Weekly Goals**: Track your weekly learning goals
- **Quick Actions**: Quick access to browse lessons and accessibility settings

### 3. Learning Plan

- Navigate to the "Learn" page from the navigation menu
- Select your class and preferred language
- Generate a personalized learning plan using the AI-powered plan generator
- Browse subjects and topics
- Click "Start Learning" on any subject to begin watching video lessons

### 4. Video Player

- Watch comprehensive video playlists for each subject
- Your progress is automatically tracked
- Complete lessons to mark them as done
- Navigate back to your dashboard or learning plan anytime

### 5. Course Navigation

**From Dashboard:**
- Click on any subject in the "Your Progress" section to open that course
- Click on any lesson in "Recent Lessons" to continue that specific lesson

**From Learning Plan:**
- Click "Start Learning" on any subject card to begin the course
- Browse topics and select specific lessons

### 6. Accessibility Features

- Navigate to the "Accessibility" page to customize:
  - Font size
  - High contrast mode
  - Reduced motion
  - Text-to-speech
  - Dyslexia-friendly fonts

### 7. Offline Mode

- Access downloaded content when offline
- Download courses for offline viewing (feature in development)

## Project Structure

```
sahaara-your-learning-path-main/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable React components
│   │   ├── layout/        # Layout components (Navbar, Footer, Layout)
│   │   ├── learning-plan/ # Learning plan related components
│   │   └── ui/            # shadcn-ui components
│   ├── hooks/             # Custom React hooks
│   │   └── useAuth.tsx    # Authentication hook
│   ├── integrations/      # Third-party integrations
│   │   └── supabase/      # Supabase client and types
│   ├── lib/               # Utility functions and helpers
│   │   ├── youtube-playlists.ts  # YouTube playlist mappings
│   │   └── perplexity.ts  # AI plan generation
│   ├── pages/             # Page components
│   │   ├── DashboardPage.tsx
│   │   ├── LearnPage.tsx
│   │   ├── VideoPlayerPage.tsx
│   │   ├── LoginPage.tsx
│   │   ├── OfflinePage.tsx
│   │   └── AccessibilityPage.tsx
│   ├── App.tsx            # Main app component with routing
│   └── main.tsx           # Entry point
├── supabase/
│   └── migrations/        # Database migration files
├── .env                   # Environment variables (create this)
├── package.json           # Dependencies and scripts
├── vite.config.ts         # Vite configuration
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Technologies

This project is built with:

- **Vite** - Fast build tool and dev server
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **React Router** - Client-side routing
- **shadcn-ui** - Beautiful, accessible component library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (database, auth, storage)
- **TanStack Query** - Data fetching and caching
- **Lucide React** - Icon library

## Database Schema

The application uses the following main tables:

- **profiles** - User profile information (name, class, language preferences)
- **learning_progress** - Tracks lesson progress and completion
- **user_streaks** - Tracks daily learning streaks
- **user_preferences** - Accessibility and UI preferences
- **achievements** - User achievements and badges

## Troubleshooting

### Common Issues

1. **"Supabase URL not found" error**
   - Make sure you've created a `.env` file with the correct Supabase credentials
   - Restart the dev server after adding environment variables

2. **Database errors**
   - Ensure you've run all database migrations
   - Check that Row Level Security (RLS) policies are set up correctly

3. **Build errors**
   - Clear `node_modules` and reinstall: `rm -rf node_modules && npm install`
   - Check that you're using Node.js v18 or higher

4. **Port already in use**
   - Change the port in `vite.config.ts` or kill the process using the port

5. **Chunk size warning during build**
   - The build configuration has been optimized with `chunkSizeWarningLimit: 1000` in `vite.config.ts`
   - This warning is informational and won't prevent deployment
   - The build uses code splitting to optimize bundle sizes

## Deployment

### Deploying to Vercel

This project is configured for easy deployment on Vercel:

1. **Connect your repository to Vercel:**
   - Go to [Vercel](https://vercel.com/) and sign in
   - Click "New Project" and import your GitHub repository
   - Vercel will auto-detect the Vite framework

2. **Configure Environment Variables:**
   - In Vercel project settings, add your environment variables:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`

3. **Build Configuration:**
   - The `vercel.json` file is already configured
   - Build command: `npm run build`
   - Output directory: `dist`
   - Framework: Vite (auto-detected)

4. **Deploy:**
   - Click "Deploy" and Vercel will build and deploy your app
   - The first deployment may take a few minutes

5. **Troubleshooting Blank Page:**
   If you see a blank page after deployment:
   
   **a. Check Environment Variables:**
   - Go to your Vercel project → Settings → Environment Variables
   - Ensure both `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are set
   - Make sure they're added for "Production", "Preview", and "Development" environments
   - After adding/updating, trigger a new deployment
   
   **b. Check Build Logs:**
   - Go to your Vercel project → Deployments
   - Click on the latest deployment
   - Check the "Build Logs" tab for any errors
   - Look for missing dependencies or build failures
   
   **c. Check Browser Console:**
   - Open your deployed site
   - Press F12 to open Developer Tools
   - Go to the "Console" tab
   - Look for JavaScript errors (red messages)
   - Common errors:
     - "Failed to fetch" - Usually means Supabase URL is incorrect
     - "Missing environment variables" - Environment variables not set in Vercel
     - "Cannot read property of undefined" - Runtime error in code
   
   **d. Verify Build Output:**
   - The build should create a `dist` folder with `index.html` and `assets` folder
   - Check Vercel build logs to ensure the build completed successfully
   - Verify that `index.html` exists in the build output
   
   **e. Check Network Tab:**
   - Open Developer Tools → Network tab
   - Refresh the page
   - Check if `index.html` loads (should return 200 status)
   - Check if JavaScript files in `/assets` folder load correctly
   - If files return 404, the build output directory might be wrong

### Build Optimizations

The project includes several build optimizations:

- **Chunk Splitting**: Large dependencies are split into separate chunks for better caching
- **Code Splitting**: Vendor code is separated from application code
- **Asset Optimization**: Static assets are cached with optimal headers
- **SPA Routing**: All routes are properly handled for client-side routing

### Build Warnings

If you see chunk size warnings during build:
- These are informational warnings, not errors
- The `chunkSizeWarningLimit` is set to 1000KB in `vite.config.ts`
- Large dependencies (like `recharts`, `@supabase/supabase-js`) are expected to be large
- The build uses code splitting to minimize initial bundle size

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.

## GitHub Repository Language Statistics

This repository is configured to show all languages in GitHub's contribution statistics, not just TypeScript. The configuration is done via `.gitattributes` file which tells GitHub Linguist to:

- Count all file types (TypeScript, JavaScript, SQL, TOML, YAML, JSON, HTML, CSS, Markdown)
- Not mark configuration files as "vendored" (which would exclude them from statistics)
- Properly detect and display language percentages

After pushing to GitHub, all languages will appear in the repository's language breakdown. See `.github/linguist-docs.md` for more details.

## Support

For support, please contact the development team or open an issue in the repository.

---

**Happy Learning! 🎓**
