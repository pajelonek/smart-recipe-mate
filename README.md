# HealthyMeal

A web-based MVP application that empowers users to personalize recipes using AI, tailored to their dietary requirements, allergies, and taste preferences.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

HealthyMeal addresses the challenge faced by health-conscious individuals who struggle to adapt recipes to their specific caloric, macronutrient, and allergy requirements. The application provides a streamlined solution by:

- **Guided Onboarding**: A 5-step wizard collects user preferences (cuisine types, diet types, preferred ingredients, and allergies)
- **Recipe Management**: Manual recipe entry with a standardized template format
- **AI-Powered Modifications**: Chat interface for recipe adjustments that respect dietary constraints
- **Version History**: Track changes to recipes with timestamp tracking
- **Allergen Warnings**: Automatic detection and alerts for ingredients that conflict with user allergies

The application is designed for home cooks and fitness enthusiasts who prepare their own meals and need consistent, reliable recipe adaptations.

## Tech Stack

### Frontend
- **Astro 5** - Fast, efficient pages and applications with minimal JavaScript
- **React 19** - Interactive components where needed
- **TypeScript 5** - Static typing and enhanced IDE support
- **Tailwind CSS 4** - Utility-first styling framework
- **Shadcn/ui** - Accessible React component library

### Backend
- **Supabase** - Complete backend solution providing:
  - PostgreSQL database
  - Backend-as-a-Service SDK
  - Built-in user authentication
  - Open-source with self-hosting capabilities

### AI Integration
- **OpenRouter.ai** - Access to multiple AI models (OpenAI, Anthropic, Google, etc.) with:
  - Cost-effective model selection
  - Financial limit controls on API keys

### CI/CD & Hosting
- **GitHub Actions** - CI/CD pipelines
- **DigitalOcean** - Application hosting via Docker images

## Getting Started Locally

### Prerequisites

- **Node.js**: Version 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) for version management)
- **npm**: Comes with Node.js
- **Supabase account**: For database and authentication
- **OpenRouter.ai API key**: For AI functionality

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-recipe-mate
   ```

2. **Set up Node.js version**
   ```bash
   nvm use
   ```
   This will use the version specified in `.nvmrc` (22.14.0)

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # OpenRouter.ai Configuration
   OPENROUTER_API_KEY=your_openrouter_api_key
   
   # Email Configuration (if applicable)
   EMAIL_SERVICE_KEY=your_email_service_key
   ```

5. **Set up Supabase**
   - Create a new project in Supabase
   - Run database migrations (to be provided)
   - Configure authentication settings
   - Enable email authentication

6. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:4321` (or the port specified by Astro).

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with hot-reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Run ESLint and automatically fix issues |
| `npm run format` | Format code using Prettier |

## Project Scope

### MVP Features

#### User Accounts & Security
- Email/password registration with validation
- Email verification workflow
- Login with session management
- Password reset functionality

#### Onboarding & Preferences
- Mandatory 5-screen wizard on first login:
  1. Introduction
  2. Cuisine selection
  3. Diet type selection
  4. Preferred ingredients
  5. Allergies
- Editable user profile with preference management
- Profile completeness tracking

#### Recipe Management
- Manual recipe entry using standardized template
- Recipe list with search by title
- Detailed recipe view with metadata
- Recipe editing (overwrites current version)
- Recipe deletion with confirmation
- Last updated timestamp tracking

#### AI Integration
- Chat interface for recipe modification requests
- Structured AI responses with:
  - Summary of changes
  - List of modifications
  - Updated recipe sections
  - Additional tips
- User preference and allergy consideration in all AI responses
- Accept and save AI suggestions as recipe updates

#### Allergen Warnings
- Automatic scanning for allergens during recipe save
- Warning display without blocking save operation
- List of detected allergenic ingredients

#### Email Communication
- Welcome email with verification link
- Password reset email with one-time link
- No additional notifications in MVP

## Project Status

🚧 **MVP Development Phase**

This project is currently in active development. Core features are being implemented according to the PRD specifications. The application is not yet production-ready.
