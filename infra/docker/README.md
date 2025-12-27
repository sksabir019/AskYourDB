# 🐳 Docker Quick Start

Get AskYourDB running with Docker in under 5 minutes!

## Prerequisites
- Docker & Docker Compose installed
- Groq or OpenAI API key

## Quick Start with Pre-built Images (Fastest) 🚀

### 1. Setup Environment
```bash
cd infra/docker
cp .env.example .env
nano .env  # Add your GROQ_API_KEY, MONGO_PASSWORD, JWT_SECRET
```

### 2. Pull and Start
```bash
# Pull pre-built images
docker pull shazam007/askyourdb-backend:latest
docker pull shazam007/askyourdb-frontend:latest

# Start with pre-built images
docker-compose -f docker-compose.prebuilt.yml up -d
```

### 3. Seed Database
```bash
# From project root
make seed-prod
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Health**: http://localhost:3000/health

**Published Images:**
- `shazam007/askyourdb-backend:latest`
- `shazam007/askyourdb-frontend:latest`

---

## Build from Source

### 1. Setup Environment
```bash
cd infra/docker
cp .env.example .env
nano .env  # Add your GROQ_API_KEY, MONGO_PASSWORD, JWT_SECRET
```

### 2. Start Application
```bash
# From project root
make dev
# or
cd infra/docker && docker-compose -f docker-compose.dev.yml up -d
```

### 3. Seed Database (Optional)
```bash
make seed
# or
docker exec -it askyourdb-backend node dist/scripts/seedDatabase.js
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:4000/api/v1
- **Health**: http://localhost:4000/health

## Default Login
- Email: Any email
- Password: Any password (demo mode)

## Useful Commands
```bash
make dev           # Start development
make dev-down      # Stop services
make dev-logs      # View logs
make seed          # Seed database
make health        # Check health
make status        # Service status
```

## Full Documentation
See [DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md) for complete guide.

## Troubleshooting

**Port conflicts?**
```bash
# Stop existing services
make dev-down
# Or change ports in docker-compose.dev.yml
```

**Database connection failed?**
```bash
# Check MongoDB is healthy
docker-compose -f docker-compose.dev.yml ps
# Restart if needed
docker-compose -f docker-compose.dev.yml restart mongo
```

**Build errors?**
```bash
# Clean and rebuild
make clean
make dev-build
```

## Production Deployment
```bash
# Configure production .env
cd infra/docker
cp .env.example .env
nano .env  # Set production values

# Start production
make prod

# Or manually
docker-compose -f docker-compose.prod.yml up -d
```

## Support
- Full docs: [DOCKER_DEPLOYMENT.md](../../DOCKER_DEPLOYMENT.md)
- Main README: [../../README.md](../../README.md)
