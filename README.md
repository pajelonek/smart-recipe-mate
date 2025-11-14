# Smart Recipe Mate

![Status](https://img.shields.io/badge/status-MVP%20in%20progress-orange)
![Version](https://img.shields.io/badge/version-0.0.1-blue)
![Node](https://img.shields.io/badge/node-22.14.0-339933?logo=node.js&logoColor=white)

> Desktop-first recipe planning MVP that unifies dietary preferences, AI-generated meals, and personal recipe management.

## Table of Contents

- [1. Project Name](#1-project-name)
- [2. Project Description](#2-project-description)
- [3. Tech Stack](#3-tech-stack)
- [4. Getting Started Locally](#4-getting-started-locally)
- [5. Available Scripts](#5-available-scripts)
- [6. Project Scope](#6-project-scope)
- [7. Project Status](#7-project-status)
- [8. License](#8-license)

## 1. Project Name

Smart Recipe Mate

## 2. Project Description

Smart Recipe Mate is a web application MVP that supports people planning meals in adapting their diet to dietary preferences. The system combines a simple user account, mandatory nutritional preference configuration, and a recipe repository stored in a standardized text structure (title, ingredients, preparation). The key advantage is integration with AI, which generates recipes from scratch based on the provided ingredients from the fridge and the user's saved preferences, delivering the result in an agreed JSON format. The application works exclusively in the desktop browser, and every AI generation, recipes, and preferences are linked to the user account.

It solves user problems such as manually adapting online recipes to dietary needs, which is time-consuming and often inconsistent. The app collects preferences immediately after registration, allows storing recipes in a consistent format, and enables AI generation of new tailored recipes.

For full product requirements, refer to [`./.ai/prd.md`](./.ai/prd.md).

## 3. Tech Stack

### Frontend

- Astro 5 for creating fast, efficient pages and applications with minimal JavaScript.
- React 19 for interactivity where needed.
- TypeScript 5 for static typing and better IDE support.
- Tailwind 4 for convenient application styling.
- Shadcn/ui provides a library of accessible React components for the UI.

### Backend & Data

- Supabase as a comprehensive backend solution:
  - Provides PostgreSQL database.
  - Provides SDKs in multiple languages as Backend-as-a-Service.
  - Open source solution that can be hosted locally or on your own server.
  - Built-in user authentication.

### AI & Integrations

- Communication with models through OpenRouter.ai service:
  - Access to a wide range of models (OpenAI, Anthropic, Google, and many others) for high efficiency and low costs.
  - Allows setting financial limits on API keys.

### Testing

- Vitest as a unit testing framework - integrated with Vite used by Astro, provides fast test execution and excellent TypeScript support.
- React Testing Library for testing React components - ensures user-perspective testing and adherence to best practices.
- MSW (Mock Service Worker) for mocking API calls - allows isolating unit tests from external dependencies.
- Playwright for end-to-end (E2E) testing - provides testing in real browsers (Chrome, Firefox, WebKit) and automatic handling of asynchronous operations.

### Tooling & Infrastructure

- Node.js `22.14.0` (see `.nvmrc`) with npm for package management.
- ESLint, TypeScript ESLint, Prettier, and lint-staged for code quality.
- Astro CLI for building and previewing the site.
- GitHub Actions for CI/CD pipelines.
- DigitalOcean for Docker-based hosting.
- Supabase CLI (`npm run supabase:start`) to provision local services during development.

For a condensed overview, see [`./.ai/tech-stack.md`](./.ai/tech-stack.md).

## 4. Getting Started Locally

### Prerequisites

- Node.js `22.14.0` (use [nvm](https://github.com/nvm-sh/nvm) to match `.nvmrc`).
- npm (bundled with Node.js).
- Git for cloning the repository.
- Supabase account and CLI access for local services.
- OpenRouter.ai API key for AI-powered features.
- Email provider credentials for verification and password resets.

### Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd smart-recipe-mate
   ```

2. **Match the Node.js version**

   ```bash
   nvm use
   ```

   If `nvm` is not installed, install Node.js `22.14.0` manually.

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the project root and provide the credentials required by Supabase, OpenRouter.ai, and your email provider. Example keys:

   ```env
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   EMAIL_SERVICE_KEY=your_email_service_key
   ```

5. **Start Supabase services (optional but recommended for local development)**

   ```bash
   npm run supabase:start
   ```

6. **Launch the Astro development server**

   ```bash
   npm run dev
   ```

   Astro serves the application at `http://localhost:4321` by default.

### Additional Tips

- Run `npm run lint` and `npm run format` before committing to ensure consistent code style.
- Use `npm run preview` to test the production build locally before deployment.
- Review `.ai/prd.md` for product flows and acceptance criteria while developing features.

## 5. Available Scripts

| Script                   | Description                                          |
| ------------------------ | ---------------------------------------------------- |
| `npm run dev`            | Start the Astro development server with hot reload.  |
| `npm run dev:e2e`        | Start the Astro development server in test mode.     |
| `npm run build`          | Generate a production build.                         |
| `npm run preview`        | Preview the production build locally.                |
| `npm run astro`          | Access the Astro CLI for custom commands.            |
| `npm run lint`           | Run ESLint across the project.                       |
| `npm run lint:fix`       | Run ESLint with automatic fixes enabled.             |
| `npm run format`         | Format files using Prettier.                         |
| `npm run test`           | Run unit tests with Vitest.                          |
| `npm run test:ui`        | Run unit tests with Vitest UI.                       |
| `npm run test:coverage`  | Generate test coverage report.                       |
| `npm run test:e2e`       | Run end-to-end tests with Playwright.                |
| `npm run test:e2e:ui`    | Run E2E tests with Playwright UI.                    |
| `npm run test:e2e:headed`| Run E2E tests in headed mode.                        |
| `npm run test:e2e:codegen`| Generate E2E tests with Playwright codegen.         |
| `npm run test:e2e:debug` | Debug E2E tests with Playwright.                     |
| `npm run supabase:start` | Boot Supabase services locally via the Supabase CLI. |
| `npm run supabase:migrate`| Apply Supabase migrations.                           |
| `npm run supabase:reset` | Reset the Supabase database.                         |
| `npm run supabase:generate-types` | Generate TypeScript types from Supabase schema. |
| `npm run supabase:status`| Show Supabase status and export env vars.            |

## 6. Project Scope

### MVP Features

- **Accounts & Security**: Email/password registration with complexity checks, email verification, login for verified accounts only, password reset via one-time links, and protection of authenticated resources (US-001).
- **Onboarding & Preferences**: Mandatory five-step wizard (diet type, preferred ingredients, cuisines, allergies) on first login with validation; editable profile that tracks last update metadata (US-005, US-006).
- **Recipe Repository**: User-specific recipe list, search by title, tag-based filtering (up to 10 tags with autocomplete), standardized structure, detail view, editing, and soft deletion (US-007, US-008, US-010, US-011, US-012).
- **AI Recipe Generation**: Ingredient-driven prompts producing new recipes in JSON (Summary, Ingredients, Preparation); accept/tag/save or dismiss; history of generations (US-013, US-014, US-016).
- **Safety & Error Handling**: Allergen detection, error logging for AI, user-friendly error messages (US-015, US-017).

### Out of Scope for MVP

- Importing recipes from URLs.
- Media upload and storage (images, videos, files).
- Sharing recipes or social features.
- Additional transactional emails beyond registration and password reset.
- Recipe export workflows.
- KPI dashboards or advanced analytics.

### Dependencies & Assumptions

- External email provider for verification and reset flows.
- OpenRouter.ai account for AI model access.
- Supabase database for persistent storage, auth, and logs.
- Users supply text-based recipe content and self-report dietary data.

### Risks & Open Questions

- Scaling the recipe list (pagination, lazy loading).
- Analytics instrumentation for business KPIs.
- AI API reliability, latency, and costs.
- Content validation for recipe consistency.

## 7. Project Status

🚧 **MVP development in progress**

Core functionality is under active construction according to the product requirements in `.ai/prd.md`. Success metrics include:

- 90% of registered users completing preferences within 7 days.
- 75% of active users generating at least one AI recipe per week.
- Monitoring via AI interaction logs.

Contributions should align with the user stories in `.ai/prd.md`.

## 8. License

License information is not yet defined. Please contact the project maintainers to clarify usage rights or replace this section once a license is selected (e.g., MIT, Apache 2.0).
