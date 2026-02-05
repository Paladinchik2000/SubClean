# SubClean - Subscription Cleanup Application

## Overview

SubClean is a subscription management application that helps users track their recurring subscriptions, monitor usage patterns, and get smart reminders to cancel unused services. The app provides a dashboard with spending analytics, usage tracking, and cancellation management to help users save money on forgotten or underutilized subscriptions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming (supports light/dark modes)
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for spending visualization (pie charts by category)

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **API Design**: RESTful API endpoints under `/api/` prefix
- **Authentication**: Replit Auth (OpenID Connect) supporting Google, GitHub, and email/password login
- **Development Server**: Vite dev server with HMR, proxied through Express
- **Production Build**: esbuild for server bundling, Vite for client bundling

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL with user-specific data isolation via userId
- **Schema Definition**: Shared schema in `shared/schema.ts` with Drizzle-Zod for validation
- **Auth Models**: User and session models in `shared/models/auth.ts`
- **Storage Abstraction**: Interface-based storage pattern (`IStorage`) with in-memory implementation (all methods now require userId)
- **Database Migrations**: Drizzle Kit for schema migrations (`db:push` command)

### Authentication & Authorization
- **Provider**: Replit Auth (OIDC-based) via `server/replit_integrations/auth/`
- **Auth Routes**: `/api/login` (start OAuth flow), `/api/logout` (end session), `/api/auth/user` (get current user)
- **Session Storage**: PostgreSQL sessions table using connect-pg-simple
- **Middleware**: `isAuthenticated` middleware protects all API routes
- **Data Isolation**: All subscriptions, settings, and alerts are user-specific via userId foreign key

### Core Data Models
- **Users**: Authentication via Replit Auth (id, email, firstName, lastName from OIDC claims)
- **Subscriptions**: Tracks name, cost (in cents), currency, billing cycle, category, dates, and cancellation status
- **Usage Records**: Logs when subscriptions are used for activity tracking
- **Settings**: User preferences including defaultCurrency, emailNotifications, pushoverNotifications, pushoverUserKey, renewalReminderDays

### Key Features
- **Onboarding Flow**: Welcome screen with value proposition and privacy information
- **Home Dashboard**: Monthly and annual spending summaries, top 3 biggest subscriptions, payment calendar, quick stats (avg per subscription, daily cost)
- **Payment Calendar**: Visual calendar showing upcoming payment dates with 30-day summary and date selection
- **Subscriptions List**: Filterable by monthly/yearly/trials/flagged subscriptions with search bar for filtering by name
- **Subscription Detail**: Charge history timeline, next billing date, usage tracking, cancel actions
- **Analytics Page**: Category spending pie chart, billing cycle bar chart, spending breakdown, key metrics, 6-month spending trends chart with month-over-month comparison
- **Savings Tracking**: Monitor cancelled subscriptions and total money saved
- **Alerts System**: Price increases, upcoming renewals, trial endings, unused subscriptions
- **Settings Page**: Currency preferences, notification settings, data export/import
- **Multi-Currency Support**: 21 currencies (USD, EUR, GBP, JPY, RUB, SEK, PLN, INR, CHF, BRL, COP, UAH, RON, HUF, CAD, AUD, GEL, KRW, KZT, TRY, BDT)
- **Data Export**: Export subscription data as JSON or CSV
- **Bulk CSV Import**: Import subscriptions from CSV files (Name, Cost columns required; Billing Cycle, Category, Currency optional)
- **Duplicate Detection**: Warns when adding a subscription similar to an existing one
- **Search Functionality**: Filter subscriptions by name on the Subscriptions page
- **Sidebar Navigation**: Easy navigation between Home, Subscriptions, Analytics, Savings, Alerts, Settings
- Usage tracking with "days since last use" calculations
- Trial subscription support with end date tracking
- Responsive design with mobile support and dark mode

### API Endpoints
- `GET /api/app-state` - Get app state including onboarding status and settings
- `POST /api/onboarding/complete` - Mark onboarding as complete
- `GET /api/subscriptions` - List all subscriptions with usage data
- `GET /api/subscriptions/:id` - Get subscription details
- `POST /api/subscriptions` - Create subscription (supports currency field)
- `PATCH /api/subscriptions/:id` - Update subscription
- `DELETE /api/subscriptions/:id` - Delete subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `PATCH /api/subscriptions/:id/toggle-cancellation` - Toggle marked for cancellation
- `POST /api/subscriptions/:id/usage` - Log usage
- `GET /api/alerts` - List alerts
- `PATCH /api/alerts/:id/dismiss` - Dismiss alert
- `GET /api/savings` - Get savings summary
- `GET /api/settings` - Get user settings
- `PATCH /api/settings` - Update settings
- `GET /api/export/:format` - Export data (json or csv)

## External Dependencies

### Database
- **PostgreSQL**: Primary database (requires `DATABASE_URL` environment variable)
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI Libraries
- **Radix UI**: Full suite of accessible UI primitives (dialogs, dropdowns, forms, etc.)
- **Recharts**: Charting library for spending visualization
- **Lucide React**: Icon library
- **Embla Carousel**: Carousel component
- **Vaul**: Drawer component
- **cmdk**: Command palette component

### Development Tools
- **Vite**: Frontend build tool with React plugin
- **Replit Plugins**: Runtime error overlay, cartographer, and dev banner for Replit environment
- **drizzle-kit**: Database schema management

### Validation
- **Zod**: Runtime type validation
- **drizzle-zod**: Bridge between Drizzle schemas and Zod validators
- **@hookform/resolvers**: Zod resolver for React Hook Form