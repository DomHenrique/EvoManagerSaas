## Project Overview

This is a React-based web application called EvoManager SaaS, designed to be a comprehensive dashboard for managing WhatsApp Business communications through the Evolution API. The project is built with Vite, TypeScript, and React Router. It uses Supabase for authentication and database services, and the Gemini API for AI-powered features.

The application provides a centralized interface for managing WhatsApp instances, groups, and users. It also includes a dashboard with real-time analytics and a chat interface.

## Building and Running

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   Access to a running Evolution API server
*   Supabase project credentials
*   Gemini API key

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd evomanager-saas
    ```
2.  Install dependencies:
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
```

### Running the Application

*   **Development:** `npm run dev`
*   **Production Build:** `npm run build`
*   **Preview Production Build:** `npm run preview`

## Testing

The project includes a comprehensive test suite. The following commands can be used to run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Development Conventions

*   **Coding Style:** The project uses ESLint and Prettier to enforce a consistent coding style.
*   **Type Safety:** TypeScript is used for static type checking.
*   **Component Structure:** The project follows a standard React component structure, with pages in the `pages` directory and reusable components in the `components` directory.
*   **Styling:** Tailwind CSS is used for styling.
*   **API Integration:** The project uses a service-based architecture for interacting with external APIs like Supabase and the Evolution API.
