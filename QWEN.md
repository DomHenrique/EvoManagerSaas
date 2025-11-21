# EvoManager SaaS - Project Documentation

## Project Overview

EvoManager SaaS is a React-based web application built with Vite, TypeScript, and React Router. It serves as a management dashboard for Evolution API instances, allowing users to manage WhatsApp business communications through a centralized web interface. The application integrates with Supabase for user authentication and database management, and connects to an external Evolution API service to manage WhatsApp instances.

### Key Technologies
- **Frontend**: React 19, TypeScript, Vite
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS (implied from class names)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v6
- **QR Codes**: react-qr-code
- **Backend API**: Evolution API (external VPS service)
- **AI Integration**: Gemini API for AI-powered chat functionality

### Main Features
- Dashboard with instance statistics
- WhatsApp instance management (create, connect, monitor)
- Group management
- User management
- AI-powered chat interface
- Settings configuration

## Project Structure

```
evomanager-saas/
├── App.tsx                 # Main application component with routing
├── index.tsx              # Application entry point
├── constants.ts           # Configuration constants and environment handling
├── types.ts               # TypeScript interfaces and type definitions
├── vite.config.ts         # Vite build configuration
├── .env                   # Environment variables
├── components/
│   └── Layout.tsx         # Main layout component with sidebar navigation
├── pages/                 # React page components (Dashboard, Instances, etc.)
├── services/
│   └── supabase.ts        # Supabase client initialization and helpers
```

## Building and Running

### Prerequisites
- Node.js
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Variables
The application requires several environment variables. Create a `.env.local` file with the following:

```bash
# Gemini / AI provider API key
VITE_GEMINI_API_KEY=your_api_key_here

# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Evolution API configuration
VITE_EVOLUTION_URL=your_evolution_api_url
VITE_EVOLUTION_API_KEY=your_evolution_api_key

# AI webhook endpoint
VITE_AI_WEBHOOK_URL=your_ai_webhook_url

# SMTP settings for email
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### Running the Application
1. Set your `GEMINI_API_KEY` in `.env.local`
2. Run the development server:
   ```bash
   npm run dev
   ```

### Production Build
To create a production build:
```bash
npm run build
```

### Preview Production Build
To preview the production build locally:
```bash
npm run preview
```

## Development Conventions

### Component Structure
- Components are written as TypeScript React functional components
- State management using React hooks (useState, useEffect, etc.)
- Type safety enforced through TypeScript interfaces defined in `types.ts`

### Routing
- Uses React Router with HashRouter for client-side navigation
- Protected routes (requires authentication)
- Layout component provides consistent UI structure across routes

### Styling
- Component-based styling using Tailwind CSS classes
- Responsive design with mobile-first approach
- Consistent color scheme using Tailwind's color palette

### Authentication
- Supabase Auth handles user authentication
- Session management with automatic refresh
- Protected routes that redirect unauthenticated users to login

### API Integration
- Supabase client handles database operations
- Evolution API integration for WhatsApp management
- Environment variables for API endpoints and keys
- Type-safe API calls using TypeScript interfaces

### Key Types
The application uses the following main types (defined in `types.ts`):

- `UserProfile`: User profile information
- `AppUser`: Application user with role and status
- `EvoInstance`: WhatsApp instance information
- `EvoGroup`: WhatsApp group information
- `ChatMessage`: Structure for chat messages
- `DashboardStats`: Dashboard statistics
- `MessageMetrics`: Message statistics for charts

## Configuration

### Constants
The `constants.ts` file handles environment variable retrieval with support for both legacy REACT_APP_ and VITE_ prefixes. It includes:
- Supabase URL and anonymous key
- Evolution API URL and key
- AI webhook URL

### Vite Configuration
- Development server runs on port 3000
- Host set to '0.0.0.0' for network access
- Environment variables prefixed with VITE_ are exposed to the browser
- Path alias '@' maps to the project root

## Deployment
The application can be built for production using `npm run build` which creates a static site in the `dist` directory that can be deployed to any static hosting service.