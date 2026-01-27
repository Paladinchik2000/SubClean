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
- **Development Server**: Vite dev server with HMR, proxied through Express
- **Production Build**: esbuild for server bundling, Vite for client bundling

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Definition**: Shared schema in `shared/schema.ts` with Drizzle-Zod for validation
- **Storage Abstraction**: Interface-based storage pattern (`IStorage`) with in-memory implementation
- **Database Migrations**: Drizzle Kit for schema migrations (`db:push` command)

### Core Data Models
- **Users**: Basic authentication with username/password
- **Subscriptions**: Tracks name, cost (in cents), billing cycle, category, dates, and cancellation status
- **Usage Records**: Logs when subscriptions are used for activity tracking

### Key Features
- Dashboard with subscription overview and spending statistics
- Category-based spending breakdown with pie chart visualization
- Usage tracking with "days since last use" calculations
- Cancellation marking for subscriptions to cancel
- Responsive design with mobile support

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