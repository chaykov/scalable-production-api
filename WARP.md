# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Local Development (Node.js)
```bash
# Start development with hot reload (Node.js watch mode)
npm run dev

# Start production mode locally
npm start

# Database operations
npm run db:generate    # Generate Drizzle schema migrations
npm run db:migrate     # Apply database migrations
npm run db:studio      # Open Drizzle Studio for database management
```

### Docker Development
```bash
# Development with Neon Local (ephemeral database branches)
npm run dev:docker     # Runs ./scripts/dev.sh
# Or manually:
docker compose -f docker-compose.dev.yml up --build

# Production Docker setup
npm run dev:prod       # Runs ./scripts/prod.sh
docker compose -f docker-compose.prod.yml up --build
```

### Code Quality
```bash
# Linting (ESLint with 4-space indentation, Unix line endings)
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues

# Formatting (Prettier)
npm run format         # Format all files
npm run format:check   # Check formatting without changes
```

## Architecture Overview

This is a **Node.js/Express API** with a **layered architecture** pattern:

### Core Technologies
- **Runtime**: Node.js 20 with ES modules (`"type": "module"`)
- **Framework**: Express.js 5.x with security middleware
- **Database**: PostgreSQL via Neon (serverless) + Drizzle ORM
- **Security**: Arcjet (rate limiting, bot detection, shield protection)
- **Auth**: JWT with HTTP-only cookies, bcrypt password hashing
- **Validation**: Zod schemas
- **Logging**: Winston with structured logging

### Database Architecture
**Dual Database Mode** - automatically switches between:
1. **Development**: Neon Local proxy with ephemeral PostgreSQL branches
2. **Production**: Neon Cloud serverless database

The database connection logic in `src/config/database.js` automatically selects:
- `postgres` driver + Drizzle for Neon Local (when `USE_NEON_LOCAL=true`)
- `@neondatabase/serverless` driver + Drizzle for Neon Cloud

### Security Architecture
**Multi-layered security** implemented via Arcjet:
- **Role-based rate limiting**: Admin (20/min), User (10/min), Guest (5/min)
- **Bot detection**: Blocks automated requests (allows search engines, previews)
- **Shield protection**: SQL injection and common attack prevention
- **Helmet**: Security headers
- **CORS**: Configurable cross-origin policies

### Application Layers
```
src/
├── index.js          # Entry point (loads env + server)
├── server.js         # Server startup
├── app.js            # Express app configuration + middleware
├── config/           # Database, logging, Arcjet configuration  
├── middleware/       # Security middleware (Arcjet integration)
├── routes/           # Route definitions (/api/auth, /api/users)
├── controllers/      # Request handlers (auth, users)
├── services/         # Business logic (auth, user services)
├── models/           # Drizzle schema definitions
├── validations/      # Zod validation schemas
└── utils/            # JWT, cookies, formatting utilities
```

### Import Paths
Uses Node.js subpath imports (package.json `imports` field):
```javascript
import logger from '#config/logger.js';
import {signUpSchema} from '#validations/auth.validation.js';
import {createUser} from '#services/auth.service.js';
```

### Error Handling Pattern
Controllers use consistent error handling:
- Zod validation with `formatValidationError()` utility
- Service layer throws semantic errors ("Invalid email or password")  
- Controllers catch and return appropriate HTTP status codes
- Winston logging for all errors

## Environment Configuration

### Required Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=development|production
LOG_LEVEL=info|debug|error

# Database (Development - Neon Local)
USE_NEON_LOCAL=true
NEON_API_KEY=your_neon_api_key
NEON_PROJECT_ID=your_neon_project_id  
PARENT_BRANCH_ID=your_parent_branch_id
DATABASE_URL=postgres://neon:npg@neon-local:5432/main?sslmode=require

# Database (Production - Neon Cloud) 
DATABASE_URL=postgres://username:password@host.neon.tech/dbname?sslmode=require

# Security
JWT_SECRET=your_jwt_secret_here
ARCJET_KEY=your_arcjet_key
```

### Environment Files
- `.env.development` - Development template (Neon Local)
- `.env.production` - Production template (Neon Cloud)
- `.env.example` - Basic template

## Docker Architecture

### Multi-stage Dockerfile
- **Base**: Node.js 20 Alpine with dumb-init and non-root user
- **Development**: Includes dev dependencies, volume mounts for hot reload
- **Production**: Optimized with only production dependencies

### Development Environment
`docker-compose.dev.yml` orchestrates:
1. **Neon Local container**: Creates ephemeral database branches linked to git branches
2. **App container**: Node.js with watch mode, volume-mounted source code

### Production Environment  
`docker-compose.prod.yml`: Optimized containers with health checks

## Development Workflows

### New Features
1. Environment: Use `npm run dev:docker` for database branch isolation
2. Authentication: JWT tokens in HTTP-only cookies (use auth middleware)
3. Validation: Create Zod schemas in `src/validations/`
4. Security: All routes protected by Arcjet middleware (automatic rate limiting)
5. Database: Use Drizzle ORM, run `npm run db:generate` after schema changes

### Code Patterns to Follow
- **Controllers**: Validate input → call service → handle errors → return response
- **Services**: Pure business logic, throw semantic errors
- **Models**: Drizzle schema definitions with proper types
- **Security**: Leverage existing Arcjet role-based limits, don't bypass middleware

### Testing Database Changes
```bash
# Generate migrations after model changes
npm run db:generate

# Apply migrations to development database  
npm run db:migrate

# Inspect database with GUI
npm run db:studio
```

## Troubleshooting

### Database Connection Issues
- **Development**: Check Neon Local container health in `docker compose logs neon-local`
- **Production**: Verify DATABASE_URL format and Neon Cloud connectivity
- **SSL Issues**: Development automatically handles self-signed certificates

### Arcjet Security Blocks
- Check rate limits by role (admin: 20/min, user: 10/min, guest: 5/min)
- Bot detection may block legitimate automation (configure `allow` list)
- Monitor logs for blocked requests and adjust rules accordingly

### Port Conflicts
- Default ports: App (3000), Database (5432)
- Modify `docker-compose*.yml` port mappings if conflicts occur

## Key Files for New Developers

**Start Reading Here:**
1. `src/app.js` - Express app setup and middleware stack
2. `src/config/database.js` - Dual database connection logic
3. `src/middleware/security.middleware.js` - Arcjet security implementation
4. `src/controllers/auth.controller.js` - Example controller pattern
5. `README-Docker.md` - Comprehensive Docker setup guide