# Scalable Production API - Docker Setup with Neon Database

This guide explains how to run the Scalable Production API using Docker with different configurations for development (using Neon Local) and production (using Neon Cloud Database).

## 🏗️ Architecture Overview

### Development Environment
- **Application**: Dockerized Node.js app with hot reload
- **Database**: Neon Local proxy creating ephemeral branches
- **Connection**: PostgreSQL driver through Neon Local
- **Benefits**: Fresh database branches, no manual cleanup, isolated development

### Production Environment
- **Application**: Optimized Docker container
- **Database**: Neon Cloud Database (serverless)
- **Connection**: Neon serverless driver
- **Benefits**: Scalable, managed database with built-in security

## 📋 Prerequisites

### Required
- Docker and Docker Compose
- Neon account with a project created
- Node.js 20+ (for local development without Docker)

### Neon Setup
1. Create a [Neon account](https://neon.tech)
2. Create a new project
3. Get your credentials:
   - **NEON_API_KEY**: From your Neon dashboard → Account Settings → API Keys
   - **NEON_PROJECT_ID**: From your Neon dashboard → Project Settings → General
   - **PARENT_BRANCH_ID**: Usually your main branch ID (default branch)
   - **DATABASE_URL**: Your production connection string

## 🚀 Development Setup (Neon Local)

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Copy from development template
cp .env.development .env

# Edit the file with your Neon credentials
# .env
NEON_API_KEY=your_neon_api_key_here
NEON_PROJECT_ID=your_neon_project_id_here
PARENT_BRANCH_ID=your_parent_branch_id_here
```

### 2. Start Development Environment

```bash
# Start both the app and Neon Local
docker-compose -f docker-compose.dev.yml up --build

# Or run in background
docker-compose -f docker-compose.dev.yml up -d --build
```

### 3. What Happens

1. **Neon Local container** starts and creates an ephemeral database branch
2. **Application container** connects to the local PostgreSQL endpoint
3. Your app is available at `http://localhost:3000`
4. Database is available at `localhost:5432` with credentials `neon:npg`

### 4. Development Workflow

```bash
# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services (this deletes the ephemeral branch)
docker-compose -f docker-compose.dev.yml down

# Rebuild after changes
docker-compose -f docker-compose.dev.yml up --build

# Run database migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Access database studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### 5. Persistent Branches (Optional)

To persist database branches per Git branch, uncomment these lines in `docker-compose.dev.yml`:

```yaml
volumes:
  - ./.neon_local/:/tmp/.neon_local
  - ./.git/HEAD:/tmp/.git/HEAD:ro,consistent
```

And set:
```yaml
environment:
  DELETE_BRANCH: "false"
```

## 🏭 Production Setup (Neon Cloud)

### 1. Configure Environment Variables

Create production environment variables:

```bash
# Copy from production template
cp .env.production .env.prod

# Edit with your production Neon connection string
# .env.prod
DATABASE_URL=postgres://username:password@host.neon.tech/dbname?sslmode=require
JWT_SECRET=your_jwt_secret_here
```

### 2. Deploy to Production

```bash
# Build and start production container
docker-compose -f docker-compose.prod.yml --env-file .env.prod up --build

# Or use environment variables directly
DATABASE_URL="your_neon_production_url" \
JWT_SECRET="your_jwt_secret" \
docker-compose -f docker-compose.prod.yml up --build
```

### 3. Production Deployment Examples

#### Using Docker Swarm
```bash
# Deploy to swarm
docker stack deploy -c docker-compose.prod.yml scalable-api
```

#### Using Environment Variables
```bash
# Set environment variables (recommended for CI/CD)
export DATABASE_URL="postgres://username:password@host.neon.tech/dbname?sslmode=require"
export JWT_SECRET="your_jwt_secret"

docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Configuration Details

### Database Connection Logic

The application automatically selects the appropriate database driver:

```javascript
// Development with Neon Local
if (process.env.USE_NEON_LOCAL === 'true') {
    // Uses postgres driver with SSL certificate handling
    const client = postgres(DATABASE_URL, {
        ssl: { rejectUnauthorized: false }
    });
}

// Production with Neon Cloud
else {
    // Uses Neon serverless driver
    const sql = neon(DATABASE_URL);
}
```

### Environment Variables

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `NODE_ENV` | `development` | `production` | Environment mode |
| `USE_NEON_LOCAL` | `true` | `false` | Toggle between drivers |
| `DATABASE_URL` | Neon Local format | Neon Cloud format | Database connection |
| `NEON_API_KEY` | Required | Not needed | Neon API access |
| `NEON_PROJECT_ID` | Required | Not needed | Your Neon project |
| `PARENT_BRANCH_ID` | Required | Not needed | Branch to fork from |

### Connection Strings

```bash
# Development (Neon Local)
DATABASE_URL=postgres://neon:npg@neon-local:5432/main?sslmode=require

# Production (Neon Cloud)
DATABASE_URL=postgres://username:password@host.neon.tech/dbname?sslmode=require
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Neon Local Connection Failed
```bash
# Check if Neon Local is healthy
docker-compose -f docker-compose.dev.yml ps

# View Neon Local logs
docker-compose -f docker-compose.dev.yml logs neon-local

# Restart services
docker-compose -f docker-compose.dev.yml restart
```

#### 2. SSL Certificate Issues
The development setup handles self-signed certificates automatically. If you see SSL errors:

```javascript
// This is already configured in database.js
ssl: {
    rejectUnauthorized: false // Allows Neon Local self-signed certs
}
```

#### 3. Branch Creation Failed
```bash
# Check your Neon credentials
echo $NEON_API_KEY
echo $NEON_PROJECT_ID

# Verify branch exists in Neon dashboard
# Try using main branch ID for PARENT_BRANCH_ID
```

#### 4. Port Conflicts
If port 5432 or 3000 is already in use:

```yaml
# Change ports in docker-compose files
ports:
  - "15432:5432"  # Use different host port
  - "13000:3000"  # Use different host port
```

### Health Checks

```bash
# Check application health
curl http://localhost:3000/health

# Check database connection
docker-compose -f docker-compose.dev.yml exec neon-local pg_isready -h localhost -p 5432
```

## 📁 Project Structure

```
scalable-production-api/
├── Dockerfile                 # Multi-stage Docker build
├── .dockerignore             # Docker ignore file
├── docker-compose.dev.yml    # Development with Neon Local
├── docker-compose.prod.yml   # Production with Neon Cloud
├── .env.development          # Development environment template
├── .env.production           # Production environment template
├── src/
│   ├── config/
│   │   └── database.js       # Smart database connection logic
│   └── ...
└── README-Docker.md          # This file
```

## 🔐 Security Notes

### Development
- Neon Local uses self-signed certificates (handled automatically)
- Database branches are ephemeral and cleaned up on container stop
- No sensitive data persists between development sessions

### Production
- Use environment variables for secrets, never hardcode
- Neon Cloud provides built-in SSL/TLS encryption
- Production container runs as non-root user
- Resource limits and security constraints applied

## 📚 Additional Resources

- [Neon Local Documentation](https://neon.com/docs/local/neon-local)
- [Neon Cloud Documentation](https://neon.com/docs)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

## 🤝 Contributing

1. Use the development setup for all changes
2. Test with both Neon Local and a test Neon Cloud database
3. Ensure Docker builds succeed for both development and production targets
4. Update this documentation for any configuration changes

## 📄 License

[Your License Here]