# Deployment Guide

Guide for hosting AskYourDB in production.

## Overview

To deploy AskYourDB, you need to host:
1. **Backend API** - Node.js/Express server
2. **Frontend** - React SPA
3. **Database** - MongoDB or PostgreSQL
4. **LLM Access** - OpenAI or Groq API

## Deployment Options

### Option 1: Docker (Recommended)

Full stack deployment using Docker and Docker Compose.

#### Prerequisites
- Docker and Docker Compose installed
- OpenAI or Groq API key
- MongoDB Atlas account (or use Docker MongoDB)
- 2GB+ RAM, 10GB+ disk space

#### Step 1: Prepare Production Environment

Create `infra/docker/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:7
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

  backend:
    build:
      context: ../../backend
      dockerfile: ../infra/docker/backend.Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      PORT: 4000
      DB_ENGINE: mongo
      MONGO_URI: ${MONGO_URI}
      JWT_SECRET: ${JWT_SECRET}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      GROQ_API_KEY: ${GROQ_API_KEY}
      LLM_PROVIDER: ${LLM_PROVIDER}
    ports:
      - "4000:4000"
    depends_on:
      - mongo

  frontend:
    build:
      context: ../../frontend
      dockerfile: ../infra/docker/frontend.Dockerfile
    restart: always
    environment:
      VITE_API_URL: ${API_URL}
    ports:
      - "80:3000"
    depends_on:
      - backend

volumes:
  mongo-data:
```

#### Step 2: Create Production Dockerfiles

**Backend** (`infra/docker/backend.Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY backend/dist ./dist
COPY backend/package*.json ./
EXPOSE 4000
CMD ["npm", "start"]
```

**Frontend** (`infra/docker/frontend.Dockerfile`):
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY infra/nginx/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Config** (`infra/nginx/nginx.conf`):
```nginx
events { worker_connections 1024; }

http {
  server {
    listen 80;
    root /usr/share/nginx/html;
    
    location / {
      try_files $uri /index.html;
    }
    
    location /api {
      proxy_pass http://backend:4000;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
    }
  }
}
```

#### Step 3: Deploy

```bash
# 1. Build and start services
docker-compose -f infra/docker/docker-compose.prod.yml up -d

# 2. Seed database
docker-compose -f infra/docker/docker-compose.prod.yml exec backend npm run seed

# 3. Check status
docker-compose -f infra/docker/docker-compose.prod.yml ps
```

---

### Option 2: Heroku Deployment

#### Backend

1. Create `Procfile`:
```
web: npm run build && npm start
```

2. Deploy:
```bash
cd backend
heroku login
heroku create your-app-backend
heroku config:set NODE_ENV=production
heroku config:set OPENAI_API_KEY=sk-...
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

#### Frontend

1. Update API URL in `frontend/.env.production`:
```env
VITE_API_URL=https://your-app-backend.herokuapp.com
```

2. Deploy to Netlify or Vercel:
```bash
# Netlify
cd frontend
npm run build
netlify deploy --prod --dir dist

# Or Vercel
vercel --prod
```

---

### Option 3: AWS Deployment

#### Using ECS (Recommended)

1. **Push Docker images to ECR**:
```bash
aws ecr create-repository --repository-name askyourdb-backend
aws ecr create-repository --repository-name askyourdb-frontend

docker build -f infra/docker/backend.Dockerfile -t askyourdb-backend .
docker tag askyourdb-backend:latest [AWS_ACCOUNT].dkr.ecr.[REGION].amazonaws.com/askyourdb-backend:latest
docker push [AWS_ACCOUNT].dkr.ecr.[REGION].amazonaws.com/askyourdb-backend:latest
```

2. **Create RDS MongoDB Atlas or DocumentDB instance**

3. **Deploy with ECS Fargate**:
- Create ECS cluster
- Configure task definitions for backend and frontend
- Set environment variables in task definition
- Create services and load balancers

---

### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Create app specification:

```yaml
services:
- name: backend
  github:
    repo: YOUR_REPO
    branch: main
  build_command: cd backend && npm install && npm run build
  run_command: cd backend && npm start
  envs:
  - key: NODE_ENV
    value: production
  - key: OPENAI_API_KEY
    value: ${OPENAI_API_KEY}
  http_port: 4000

- name: frontend
  github:
    repo: YOUR_REPO
    branch: main
  build_command: cd frontend && npm install && npm run build
  run_command: cd frontend && npm run preview
  envs:
  - key: VITE_API_URL
    value: https://backend-xxxxx.ondigitalocean.app
  http_port: 3000

databases:
- name: mongodb
  version: "7"
  engine: MONGODB
```

---

## Pre-Deployment Checklist

- [ ] Set `NODE_ENV=production` in backend
- [ ] Update JWT_SECRET to a strong random value
- [ ] Rotate API keys (OpenAI/Groq)
- [ ] Configure database with strong passwords
- [ ] Set up HTTPS/SSL certificate
- [ ] Enable CORS only for your frontend domain
- [ ] Set up automated backups for database
- [ ] Configure monitoring and logging
- [ ] Test all API endpoints
- [ ] Test all LLM providers (OpenAI/Groq)
- [ ] Performance test with load testing tools

## Environment Variables Checklist

**Backend** (must set in production):
```env
NODE_ENV=production
PORT=4000
DB_ENGINE=mongo
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/askyourdb
JWT_SECRET=very-strong-random-secret-min-32-chars
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
LLM_PROVIDER=groq
CORS_ORIGIN=https://yourdomain.com
```

**Frontend** (must set in production):
```env
VITE_API_URL=https://api.yourdomain.com
```

## Monitoring & Logging

### Add logging services:

1. **CloudWatch** (AWS)
```bash
npm install aws-sdk
# Configure in backend
```

2. **DataDog** or **New Relic**
```bash
npm install datadog-browser-rum
```

3. **Sentry** (error tracking)
```bash
npm install @sentry/node
# Configure in backend/src/server.ts
```

## Scaling

- **Load Balancer**: Use Nginx or your cloud provider's LB
- **Database**: Use connection pooling (already configured)
- **Cache**: Consider Redis for query caching
- **CDN**: Put frontend behind CloudFront/CloudFlare

## Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| Health check fails | Check database connection, ensure all env vars set |
| 502 Bad Gateway | Backend container not starting, check logs |
| CORS errors | Update CORS_ORIGIN in backend to match frontend domain |
| API timeouts | Increase timeout, check database performance |
| High memory usage | Set NODE_OPTIONS="--max-old-space-size=512" |

## Backup Strategy

- **Database**: Enable automated backups (MongoDB Atlas, RDS)
- **Code**: Use GitHub for version control
- **Environment secrets**: Use cloud provider secret manager
- **Daily backups**: Retention of 30 days minimum
