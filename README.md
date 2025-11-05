# HealthyMeal

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

HealthyMeal

## 2. Project Description

HealthyMeal is a desktop-first MVP web application that helps people with dietary requirements plan meals safely and efficiently. It combines a streamlined onboarding experience, a structured personal recipe repository, and an AI assistant that generates tailored recipes based on pantry ingredients and saved preferences.

HealthyMeal solves common pain points for health-conscious cooks:

- Collects dietary preferences, preferred ingredients, cuisines, and allergens through a mandatory five-step wizard during first login.
- Stores recipes in a standardized text format (`Title`, `Ingredients`, `Preparation`) with tagging, search, and editing capabilities.
- Generates new recipes via an AI chat that respects profile data and blocks concurrent prompts until a response is received.
- Detects allergens at save time and surfaces warnings in recipe lists and detail views.
- Logs AI interactions and critical user actions for diagnostics and future analytics.

For the full product requirements, refer to [`./.ai/prd.md`](./.ai/prd.md).

## 3. Tech Stack

### Frontend

- Astro 5 for fast, content-first pages with minimal runtime overhead.
- React 19 for interactive components within Astro islands.
- TypeScript 5 to ensure type-safe development and better tooling.
- Tailwind CSS 4 and `tailwind-merge` for utility-first styling.
- Shadcn/ui and Radix UI primitives for accessible UI elements.
- Lucide React icons for consistent iconography.

### Backend & Data

- Supabase (PostgreSQL + auth + storage) as the backend-as-a-service.
- Supabase authentication flows for email verification, session management, and password resets.

### AI & Integrations

- OpenRouter.ai for routing to multiple AI models (OpenAI, Anthropic, Google, etc.) with cost controls.
- REST-based AI messaging with JSON payloads for prompts and responses.

### Testing

- **Vitest** for unit testing with fast execution and TypeScript support, integrated with Vite.
- **React Testing Library** for testing React components with a user-centric approach.
- **MSW (Mock Service Worker)** for mocking API calls in unit tests.
- **Playwright** for end-to-end (E2E) testing across real browsers (Chrome, Firefox, WebKit).

### Tooling & Infrastructure

- Node.js `22.14.0` (see `.nvmrc`) with npm for package management.
- ESLint, TypeScript ESLint, Prettier, and lint-staged for code quality.
- Astro CLI for building and previewing the site.
- GitHub Actions for CI/CD pipelines.
- DigitalOcean for Docker-based hosting.
- Supabase CLI (`npm run supabase:start`) to provision local services during development.

For a condensed overview of the technology choices, see [`./.ai/tech-stack.md`](./.ai/tech-stack.md).

## 4. Getting Started Locally

### Prerequisites

- Node.js `22.14.0` (use [`nvm`](https://github.com/nvm-sh/nvm) to match `.nvmrc`).
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
| `npm run build`          | Generate a production build.                         |
| `npm run preview`        | Preview the production build locally.                |
| `npm run astro`          | Access the Astro CLI for custom commands.            |
| `npm run lint`           | Run ESLint across the project.                       |
| `npm run lint:fix`       | Run ESLint with automatic fixes enabled.             |
| `npm run format`         | Format files using Prettier.                         |
| `npm run test`           | Run unit tests with Vitest.                          |
| `npm run test:watch`     | Run unit tests in watch mode.                        |
| `npm run test:coverage`  | Generate test coverage report.                       |
| `npm run test:e2e`       | Run end-to-end tests with Playwright.                |
| `npm run supabase:start` | Boot Supabase services locally via the Supabase CLI. |

## 6. Project Scope

### MVP Features

- **Accounts & Security**: Email/password registration with complexity checks, email verification, login for verified accounts only, password reset via one-time links, and protection of authenticated resources.
- **Onboarding & Preferences**: Mandatory five-step wizard (intro, diet type, preferred ingredients, cuisines, allergies) on first login with validation and full restart on interruption; editable profile that tracks last update metadata and refreshes session data.
- **Recipe Repository**: User-specific recipe list, search by title, tag-based filtering, up to ten tags per recipe with autocomplete, standardized recipe structure, detail view, editing with overwrite semantics, and deletion with confirmation.
- **AI Recipe Generation**: Ingredient-driven prompts that produce new recipes in `Summary`, `Ingredients`, `Preparation` JSON structure; ability to accept/tag/save or dismiss results; conversation history linked to stored recipes; single in-flight request enforced.
- **Safety & Compliance**: Allergen detection during save with warning modals and list indicators, plus guidance links.
- **History & Observability**: Persistent history of AI conversations, logging of AI requests/responses/errors, and tracking of key user actions.

### Out of Scope for MVP

- Importing recipes from URLs.
- Media upload and storage (images, video, files).
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

- Undefined strategy for scaling the recipe list (pagination, lazy loading).
- Missing analytics instrumentation may hinder measurement of business KPIs.
- Reliance on third-party AI could affect latency, availability, and cost.
- Absence of automated content validation may impact recipe consistency.

## 7. Project Status

🚧 **MVP development in progress**

Core functionality is under active construction according to the product requirements. Success metrics under consideration include:

- 90% of new users completing the preference wizard within 7 days.
- 75% of active users generating at least one AI-driven recipe per week.
- Operational monitoring via AI interaction logs until formal analytics are introduced.

Contributions should align with the scenarios documented in [`./.ai/prd.md`](./.ai/prd.md) and the user stories defined there.

## 8. License

License information is not yet defined. Please contact the project maintainers to clarify usage rights or replace this section once a license is selected (e.g., MIT, Apache 2.0).
