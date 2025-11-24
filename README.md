# EvoManager SaaS - WhatsApp Business Management Dashboard

EvoManager SaaS is a comprehensive React-based web application that provides a centralized dashboard for managing WhatsApp Business communications through Evolution API. Built with modern technologies including Vite, TypeScript, and React Router, this platform streamlines WhatsApp instance management, group administration, and messaging analytics for businesses.

## 🚀 Features

- **Dashboard Analytics**: Real-time statistics and metrics for WhatsApp instances
- **Instance Management**: Create, connect, monitor, and manage multiple WhatsApp instances
- **Group Administration**: Create, manage, and monitor WhatsApp groups
- **User Management**: Role-based access control for team members
- **AI-Powered Chat Interface**: Intelligent chatbot functionality powered by Gemini API
- **QR Code Integration**: Simplified WhatsApp connection process via QR codes
- **Message Analytics**: Track sent/received messages with detailed visualizations
- **Contact Management**: Centralized contact database with search and filtering

## 🛠️ Technologies Used

### Frontend
- **React 19** - Component-based UI library
- **TypeScript** - Static type checking for enhanced code reliability
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router v6** - Client-side routing solution

### Backend & Services
- **Supabase** - Authentication, database, and real-time features
- **Evolution API** - WhatsApp Business API integration (external VPS service)
- **Gemini API** - AI-powered chat capabilities

### UI Components
- **Lucide React** - Beautiful, accessible icons
- **Recharts** - Declarative charting and data visualization
- **React QR Code** - QR code generation for WhatsApp connection

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- Access to a running Evolution API server
- Supabase project credentials
- Gemini API key (for AI features)

## 🚀 Quick Start

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd evomanager-saas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env.local` file in the root directory with the following configuration:

```bash
# Gemini / AI provider API key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Supabase configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Evolution API configuration (your Evolution API server)
VITE_EVOLUTION_URL=your_evolution_api_server_url
VITE_EVOLUTION_API_KEY=your_evolution_api_key

# AI webhook endpoint (optional, for AI functionality)
VITE_AI_WEBHOOK_URL=your_ai_webhook_url

# SMTP settings for email functionality (optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=your_smtp_port
SMTP_SECURE=true
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

### Running the Application

#### Development Mode

1. Ensure your environment variables are properly configured
2. Start the development server:
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:3000`

#### Production Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## ⚙️ Configuration

### Vite Configuration

The application uses Vite with the following key settings:
- Development server runs on port 3000
- Host set to '0.0.0.0' for network access
- Environment variables prefixed with VITE_ are exposed to the browser
- Path alias '@' maps to the project root

### API Integration

#### Evolution API Connection
The application connects to Evolution API to manage WhatsApp instances. Ensure your Evolution API server is running and accessible.

#### Supabase Integration
User authentication and database operations are handled through Supabase. Configure your Supabase project and add the credentials to your environment variables.

#### AI Features
AI-powered chat functionality is enabled through the Gemini API. For advanced AI features, ensure your webhook is properly configured to receive and process AI responses.

## 🏗️ Project Structure

```
evomanager-saas/
├── App.tsx                 # Main application component with routing
├── index.tsx              # Application entry point
├── constants.ts           # Configuration constants and environment handling
├── types.ts               # TypeScript interfaces and type definitions
├── vite.config.ts         # Vite build configuration
├── components/
│   ├── Layout.tsx         # Main layout component with sidebar navigation
│   └── ...                # Other reusable components
├── pages/
│   ├── Dashboard.tsx      # Dashboard with analytics and metrics
│   ├── Instances.tsx      # WhatsApp instance management
│   ├── Groups.tsx         # Group management interface
│   ├── Users.tsx          # User management section
│   └── ...                # Other page components
├── services/
│   └── supabase.ts        # Supabase client initialization and helpers
├── utils/
│   └── ...                # Utility functions (dashboard data, permissions, etc.)
├── assets/
│   └── ...                # Static assets, images, icons
├── styles/
│   └── ...                # Global styles and Tailwind configuration
└── public/
    └── ...                # Public assets
```

## 📊 Data Flow

### Dashboard Analytics
The dashboard retrieves real data from the Evolution API through the following process:
1. Fetches instance statistics directly from the Evolution API
2. Extracts aggregate counts (messages, contacts) from instance data
3. Combines data for comprehensive overview display
4. Visualizes metrics using Recharts

### Instance Management
1. Creates new WhatsApp instances through Evolution API
2. Manages instance lifecycle (connect, disconnect, monitor)
3. Shows instance status with real-time updates
4. Handles QR code generation for connection

## 🧪 Testing

The project includes comprehensive tests for both frontend and backend integration:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Docker Deployment

The project includes Docker configuration files for easy containerization:

```bash
# Build Docker image
docker build -t evomanager-saas .

# Run with Docker
docker run -p 3000:3000 --env-file .env.local evomanager-saas
```

### Production Deployment

1. Build the application: `npm run build`
2. Serve the `dist` folder using a static file server or CDN
3. Configure your environment variables for the target environment
4. Ensure Evolution API and Supabase are properly configured for production

### Environment-Specific Configuration

For different environments (development, staging, production), create environment-specific `.env` files:
- `.env.development` for development environment
- `.env.staging` for staging environment
- `.env.production` for production environment

## 🤝 Contributing

We welcome contributions to EvoManager SaaS! Here's how you can help:

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure all tests pass (`npm test`)
5. Follow the existing code style and TypeScript conventions
6. Update or add tests as needed
7. Commit your changes with descriptive commit messages
8. Push to the branch (`git push origin feature/amazing-feature`)
9. Open a Pull Request

### Code Standards

- Use TypeScript for type safety
- Follow the existing component structure
- Write tests for new functionality
- Update documentation as needed
- Use Tailwind CSS for styling
- Follow React best practices

### Reporting Issues

When reporting issues, please include:
- Clear description of the problem
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment information (OS, browser, Node version)
- Any relevant screenshots or logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you need help with EvoManager SaaS:

- Check the [documentation](./docs) for guides and tutorials
- File an issue on the [GitHub repository](https://github.com/your-repo/evomanager-saas/issues) for bugs or feature requests
- Join our [community forum](https://example.com/community) for discussions
- Contact the maintainers via [email](mailto:support@evomanager.com)

## 🙏 Acknowledgments

- Thanks to the Evolution API team for providing the WhatsApp Business API integration
- Special thanks to the Supabase team for the excellent authentication and database services
- Appreciation to the open-source community for the various libraries and tools used in this project