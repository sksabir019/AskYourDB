# Quick Deployment Checklist

Use this checklist when deploying AskYourDB to production.

## Pre-Deployment (1-2 hours)

### Code & Security
- [ ] All tests passing: `npm test`
- [ ] No TypeScript errors: `npm run build`
- [ ] Remove console.log statements
- [ ] Rotate API keys (create new ones for production)
- [ ] Update JWT_SECRET to 32+ character random string
- [ ] Review environment variables (no hardcoded secrets)
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set NODE_ENV=production

### Database
- [ ] Create production database instance
  - MongoDB Atlas or self-hosted MongoDB
  - PostgreSQL RDS or self-hosted
- [ ] Set strong database password (32+ characters)
- [ ] Enable database backups (daily, 30-day retention)
- [ ] Test database connectivity from app
- [ ] Seed initial data if needed

### LLM APIs
- [ ] Verify OpenAI API key works and has credits
- [ ] Verify Groq API key works (or choose one)
- [ ] Test both LLM providers with sample queries
- [ ] Check rate limits and quotas

### Frontend
- [ ] Update VITE_API_URL to production backend URL
- [ ] Run `npm run build` to create optimized dist/
- [ ] Test production build locally: `npm run preview`
- [ ] Verify all API calls work
- [ ] Test dark mode toggle
- [ ] Test responsive design on mobile

### Backend
- [ ] Run `npm run build` to compile TypeScript
- [ ] Update CORS_ORIGIN to frontend domain
- [ ] Enable rate limiting
- [ ] Configure logging (Winston)
- [ ] Test health endpoints
- [ ] Load test with sample concurrent users

## Deployment (30 minutes)

### Choose your deployment platform:

#### Docker Compose (Self-hosted)
```bash
# 1. Build images
docker-compose -f infra/docker/docker-compose.prod.yml build

# 2. Start services
docker-compose -f infra/docker/docker-compose.prod.yml up -d

# 3. Seed database
docker-compose exec backend npm run seed

# 4. Check status
docker-compose ps
```

#### Heroku
```bash
# Backend
cd backend
heroku create your-app-backend
heroku config:set NODE_ENV=production OPENAI_API_KEY=sk-...
git push heroku main

# Frontend (Vercel)
cd ../frontend
vercel --prod
```

#### AWS (ECS)
- Push Docker images to ECR
- Create ECS task definitions
- Launch ECS services
- Configure Application Load Balancer
- Set up Route 53 DNS

#### DigitalOcean
- Connect GitHub repo
- Create app specification
- Deploy via App Platform
- Configure custom domain

## Post-Deployment (Ongoing)

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Enable application monitoring (DataDog/New Relic)
- [ ] Configure log aggregation (CloudWatch/ELK)
- [ ] Set up alerting for errors
- [ ] Monitor database performance

### Testing
- [ ] Test user registration and login
- [ ] Test sample queries (all types)
- [ ] Test both LLM providers
- [ ] Test with different databases
- [ ] Load test with concurrent users
- [ ] Test on mobile browsers

### Security
- [ ] Enable WAF (Web Application Firewall)
- [ ] Set up DDoS protection
- [ ] Review security headers (HSTS, CSP, etc.)
- [ ] Enable database encryption at rest
- [ ] Enable API authentication logs
- [ ] Schedule regular security audits

### Performance
- [ ] Monitor response times (target: <2s for queries)
- [ ] Monitor database query performance
- [ ] Monitor API rate limits
- [ ] Monitor LLM API usage and costs
- [ ] Enable caching where appropriate

### Maintenance
- [ ] Set up automated database backups
- [ ] Set up automated code backups
- [ ] Monitor disk space usage
- [ ] Plan update/patch schedule
- [ ] Document runbooks for common issues
- [ ] Plan disaster recovery procedures

## Production Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=production
PORT=4000

# Database
DB_ENGINE=mongo
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/askyourdb?retryWrites=true&w=majority
# OR for PostgreSQL:
# DB_ENGINE=postgres
# PG_HOST=db.example.com
# PG_PORT=5432
# PG_USER=postgres
# PG_PASSWORD=strong_password_here

# LLM
LLM_PROVIDER=groq  # or openai
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Security
JWT_SECRET=generate_strong_random_secret_here_min_32_chars
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100
```

### Frontend (.env.production)
```env
VITE_API_URL=https://api.yourdomain.com
```

## Rollback Plan

If deployment fails:

1. **Check logs**:
   - `docker logs container_name`
   - Cloud provider logs
   - Application logs

2. **Common issues**:
   - Database connection: Check URI, credentials, network
   - API keys: Verify keys are correct and active
   - Port conflicts: Check if ports are available
   - Memory: Increase container memory limits

3. **Rollback**:
   - Revert to previous version
   - Restore database from backup
   - Clear browser cache and try again

## Cost Estimation

Monthly costs (approximate):

| Service | Cost |
|---------|------|
| Compute (Backend) | $10-50 |
| Database (MongoDB Atlas) | $50-200 |
| LLM API (OpenAI/Groq) | $10-500* |
| Frontend Hosting | $0-20 |
| **Total** | **$70-770** |

*LLM costs depend on usage volume

## Support & Resources

- [Deployment Guide](./DEPLOYMENT.md) - Detailed deployment instructions
- [README](./README.md) - Quick start and troubleshooting
- [Backend README](./backend/README.md) - API documentation
- [Frontend README](./frontend/README.md) - Frontend setup
