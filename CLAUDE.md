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

#### Migration Best Practices

**After schema changes:**
```bash
cd apps/backend
pnpm db:generate    # Generate migration files
pnpm db:migrate     # Test locally - MUST succeed before deploy
```

**Before production deploy:**
```bash
# Optional but recommended: Test with clean database
createdb accorto_test
DATABASE_URL=postgres://user@localhost:5432/accorto_test pnpm db:migrate
dropdb accorto_test  # Clean up after test
```

**Never:**
- Deploy without testing migrations locally first
- Ignore migration errors and continue
- Make manual database changes without corresponding migrations

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

## Development Workflow

### Code Changes and Deployment Flow

**IMPORTANT**: Always follow this workflow when making changes to the codebase:

1. **Make changes locally**
   - Edit files in local development environment
   - Test changes locally if possible

2. **Commit changes locally**
   ```bash
   git add [modified-files]
   git commit -m "Descriptive commit message"
   ```

3. **Push to remote repository**
   ```bash
   git push origin develop
   ```

4. **Deploy to EC2 server**
   ```bash
   ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "cd /home/ec2-user/tableorder && git pull && [build-and-restart-commands]"
   ```

**Example EC2 deployment commands:**
- Backend: `cd apps/backend && npm run build && pm2 restart backend`
- Frontend apps: `cd apps/[app-name] && npm run build && pm2 restart [app-name]`
- All apps: Run build and restart for each modified app

**Never:**
- Make direct changes on EC2 server
- Skip version control (git)
- Deploy without testing locally first

This workflow ensures proper version control, traceability, and safe deployment practices.

## Production Deployment Guide

### Prerequisites

- EC2 instance running Amazon Linux 2023
- Key file: `accorto-simple-key.pem`
- Instance IP: `35.72.96.45` (Elastic IP)
- Required environment variables set in production

### Full Deployment Process

#### 1. Initial Setup (One-time)

```bash
# Connect to EC2
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45

# Install nginx
sudo yum update -y && sudo yum install -y nginx

# Start and enable nginx
sudo systemctl start nginx && sudo systemctl enable nginx

# Set up nginx configuration (see nginx config below)
```

#### 2. Deploy New Changes

```bash
# 1. Connect and pull latest code
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "cd /home/ec2-user/tableorder && git pull origin develop"

# 2. Run database migrations (IMPORTANT: Check for errors!)
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "cd /home/ec2-user/tableorder/apps/backend && npm run db:migrate"
# If migration fails, check logs and manually apply SQL from migration files

# 3. Build and restart backend
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "cd /home/ec2-user/tableorder/apps/backend && npm run build && pm2 restart backend || pm2 start dist/index.js --name backend"

# 4. Build all frontend apps
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "cd /home/ec2-user/tableorder && for app in table admin kitchen staff; do echo 'Building \$app...'; cd apps/\$app && npm run build && cd ../..; done"

# 5. Fix file permissions for nginx
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "sudo chmod -R 755 /home/ec2-user/tableorder/apps/*/dist && sudo chmod 755 /home/ec2-user /home/ec2-user/tableorder"

# 6. Reload nginx
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "sudo systemctl reload nginx"
```

#### 3. Nginx Configuration

Create `/etc/nginx/conf.d/tableorder.conf`:

```nginx
# Table Ordering System - Production Configuration

# Table App (Port 3001)
server {
    listen 3001;
    listen [::]:3001;
    
    root /home/ec2-user/tableorder/apps/table/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Admin App (Port 3002)
server {
    listen 3002;
    listen [::]:3002;
    
    root /home/ec2-user/tableorder/apps/admin/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Kitchen App (Port 3003)
server {
    listen 3003;
    listen [::]:3003;
    
    root /home/ec2-user/tableorder/apps/kitchen/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Staff App (Port 3004)
server {
    listen 3004;
    listen [::]:3004;
    
    root /home/ec2-user/tableorder/apps/staff/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. Environment Variables

Ensure these are set in production:

**Backend:**
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://user:password@host:port/database`
- `JWT_SECRET=` (32+ character random string)
- `PORT=3000` (optional, has default)

**Frontend (build time):**
- `VITE_API_BASE_URL=http://35.72.96.45:3000/api`

#### 5. Production URLs

After deployment, applications are available at:

- **Backend API**: http://35.72.96.45:3000
- **Table App**: http://35.72.96.45:3001 (Customer ordering)
- **Admin App**: http://35.72.96.45:3002 (Management interface)
- **Kitchen App**: http://35.72.96.45:3003 (Kitchen display)
- **Staff App**: http://35.72.96.45:3004 (Staff interface)

#### 6. Health Checks

```bash
# Check backend API
curl http://35.72.96.45:3000/health

# Check frontend apps
curl -I http://35.72.96.45:3001/
curl -I http://35.72.96.45:3002/
curl -I http://35.72.96.45:3003/
curl -I http://35.72.96.45:3004/

# Check PM2 processes
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "pm2 list"

# Check nginx status
ssh -i "accorto-simple-key.pem" ec2-user@35.72.96.45 "sudo systemctl status nginx"
```

#### 7. Troubleshooting

**If EC2 connection fails:**
- Check if instance is running in AWS console
- Restart instance: `aws ec2 reboot-instances --instance-ids i-0301c05da0336d00c`

**If apps don't serve:**
- Check file permissions: `sudo chmod -R 755 /home/ec2-user/tableorder/apps/*/dist`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Restart nginx: `sudo systemctl restart nginx`

**If API errors occur:**
- Check PM2 logs: `pm2 logs backend`
- Restart backend: `pm2 restart backend`
- Check database connectivity

**If migration fails:**
- Check specific error in migration logs
- Find relevant migration files: `find src/db/migrations -name '*.sql' -exec grep -l 'CREATE TABLE.*[table_name]' {} \;`
- Manually apply SQL: `psql $DATABASE_URL -c "SQL_COMMAND_HERE"`
- Common issue: Type conflicts - use `CREATE TYPE IF NOT EXISTS` or check existing types
