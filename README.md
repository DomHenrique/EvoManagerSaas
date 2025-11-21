# EvoManager SaaS - WhatsApp Business Management Dashboard

EvoManager SaaS is a React-based web application built with Vite, TypeScript, and React Router. It serves as a management dashboard for Evolution API instances, allowing users to manage WhatsApp business communications through a centralized web interface. The application integrates with Supabase for user authentication and database management, and connects to an external Evolution API service to manage WhatsApp instances.

## Features

- Dashboard with instance statistics
- WhatsApp instance management (create, connect, monitor)
- Group management
- User management
- AI-powered chat interface
- Settings configuration

## Technologies Used

- **Frontend**: React 19, TypeScript, Vite
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v6
- **QR Codes**: react-qr-code
- **Backend API**: Evolution API (external VPS service)
- **AI Integration**: Gemini API for AI-powered chat functionality

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd evomanager-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

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

## Running the Application

### Development

1. Make sure your environment variables are properly set
2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000` (or another port if 3000 is in use).

### Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

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
└── utils/                 # Utility functions (dashboard data, permissions, etc.)
```

## Key Configuration

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

## Dashboard Data Flow

The dashboard retrieves real data from the Evolution API through the following process:
1. Fetches instance statistics directly from the Evolution API
2. Extracts aggregate counts (messages, contacts) from instance data
3. Falls back to Supabase storage if configured (with table existence checks)
4. Displays real-time metrics on the dashboard UI

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.