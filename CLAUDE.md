# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-app table ordering system built with a monorepo structure using pnpm workspaces and Turborepo. The system consists of 4 main applications:

- **table**: Customer-facing React app for ordering (port varies)
- **admin**: Management interface for staff to manage menus, tables, etc.
- **kitchen**: Kitchen display system for order management
- **staff**: Staff interface for table and order management
- **backend**: Hono.js API server with PostgreSQL database (runs on port 3000)

## Development Commands

### Setup and Development

```bash
# Install dependencies
pnpm install

# Start all apps in development mode
pnpm dev

# Start individual apps
cd apps/backend && pnpm dev    # Backend API server
cd apps/table && pnpm dev     # Customer ordering app
cd apps/admin && pnpm dev     # Admin management app
cd apps/kitchen && pnpm dev   # Kitchen display app
cd apps/staff && pnpm dev     # Staff interface app

# Build all apps
pnpm build

# Build individual apps
cd apps/[app-name] && pnpm build
```

### Backend-specific Commands

```bash
cd apps/backend

# Build TypeScript
pnpm build

# Start production server
pnpm start

# Database operations
pnpm db:generate    # Generate Drizzle migrations
pnpm db:migrate     # Run migrations
pnpm db:seed        # Seed database with sample data
pnpm db:studio      # Open Drizzle Studio
```

## Architecture Overview

### Backend (Hono.js + Drizzle + PostgreSQL)

- **Framework**: Hono.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **API Structure**: REST API with routes in `/src/routes/`
  - `/api/menu` - Menu and category management
  - `/api/order` - Order creation and management
  - `/api/table` - Table status and management
  - `/api/staff` - Staff management
  - `/api/setting` - Application settings
- **Validation**: Zod schemas for request validation
- **Database Schema**: Located in `/src/db/schema/`

### Frontend Apps (React + TypeScript + Vite)

All frontend apps share similar structure:

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS v4
- **Routing**: React Router v6
- **State Management**: React Context API
- **API Layer**: Custom fetch utilities in `src/utils/api.ts`

### Key Frontend Patterns

#### API Integration

- Backend API base URL configured in `src/config/index.ts`
- Default: `http://localhost:3000/api`
- Set via `VITE_API_BASE_URL` environment variable

#### Common Context Patterns

- **CartContext** (table app): Manages shopping cart state and order submission
- **ToastContext**: Global notification system across all apps
- Contexts provide type-safe interfaces with proper error handling

#### Configuration Management

Each app has `src/config/index.ts` with:

- `API_CONFIG`: Backend connection settings
- `BUSINESS_CONFIG`: Business logic constants (quantities, limits)
- `UI_CONFIG`: UI behavior settings (animations, theming)

### Database Schema Key Tables

- **tables**: Restaurant table management
- **menu_categories**: Menu organization
- **menu_items**: Individual menu items with options/toppings
- **orders**: Order records with status tracking
- **order_items**: Individual items within orders
- **staff**: Staff user management

## Important Development Notes

### Port Configuration

- Backend typically runs on port 3000 (configurable via PORT env var)
- Frontend apps run on different ports managed by Vite
- Backend port setting in `src/index.ts` defaults to 3000 but often overridden to 3000

### API Error Handling

- All API responses follow `{ success: boolean, data?: T, error?: string }` pattern
- Frontend apps handle API failures gracefully with user-friendly error messages
- Use proper TypeScript interfaces for API responses

### Database Development

- Always run `pnpm db:migrate` after schema changes
- Use `pnpm db:seed` to populate development data
- Database connection configured via environment variables
- Use Drizzle Studio (`pnpm db:studio`) for database inspection

### Testing API Endpoints

Backend provides these key endpoints:

- `GET /api/menu/categories` - List menu categories
- `GET /api/menu/items` - List menu items
- `POST /api/order` - Create new order
- `GET /api/table` - List tables

Test with curl: `curl http://localhost:3000/api/menu/categories`

### Common Troubleshooting

- If backend API calls fail, ensure backend is running on port 3000
- If database errors occur, run migrations: `cd apps/backend && pnpm db:migrate`
- For TypeScript errors in frontend, check that types are imported from `../types`
- Table number configuration: Set via `VITE_TABLE_NUMBER` or defaults to "test"
