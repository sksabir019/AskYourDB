# AskYourDB

Query your database using natural language. Powered by AI (OpenAI/Groq).

## Overview

AskYourDB lets you ask questions about your data in plain English. The AI converts your questions into database queries and returns human-readable answers.

**Example:**
> "How many users signed up in the last 30 days?"
> 
> → "37 users signed up in the last 30 days."

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.9.3
- **Framework**: Express 4.18.2
- **Database**: MongoDB 7 / PostgreSQL 15
- **AI/LLM**: 
  - OpenAI (gpt-4o-mini)
  - Groq (Llama 3.3-70b)
- **Authentication**: JWT + bcryptjs
- **Validation**: Joi 17.9.2
- **Security**: Helmet, CORS, Rate Limiting, Input Sanitization
- **Logging**: Winston
- **Testing**: Jest 29
- **ORM/Query**: Mongoose (MongoDB), Knex (PostgreSQL)

### Frontend
- **Framework**: React 18.2.0
- **Language**: TypeScript 5.3.3
- **Build Tool**: Vite 5.4.21
- **Styling**: Tailwind CSS 3.3.6
- **State**: Zustand 4.4.7
- **Routing**: React Router DOM 6.20.0
- **HTTP**: Axios 1.6.2
- **Animations**: Framer Motion 10.16.16
- **UI Components**: Lucide React, React Hot Toast

### DevOps
- **Containerization**: Docker (Node 20-Alpine)
- **Orchestration**: Docker Compose
- **Database Clients**: MongoDB 7, PostgreSQL 15-Alpine
- **Nginx**: Reverse proxy & static serving

### Cloud Deployment
- Docker/Docker Compose
- Heroku, AWS (ECS, RDS), DigitalOcean, Vercel, Netlify

## Quick Start

### Prerequisites
- Node.js 18+
- Docker (for database)
- OpenAI or Groq API key

### 1. Start Database

```bash
# Start MongoDB
docker run -d --name mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run seed        # Seed sample data
npm run dev         # Start on http://localhost:4000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev         # Start on http://localhost:3001
```

### 4. Use the App

1. Open http://localhost:3001
2. Register/Login
3. Ask questions like:
   - "Show me all active customers"
   - "What's the total revenue from last month?"
   - "Top 5 products by sales"

## Configuration

Key environment variables in `backend/.env`:

```env
# Database (mongo or postgres)
DB_ENGINE=mongo
MONGO_URI=mongodb://admin:password123@127.0.0.1:27017/askyourdb?authSource=admin

# LLM Provider (openai or groq)
LLM_PROVIDER=groq
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
```

## Project Structure

```
AskYourDB/
├── backend/          # Express API server
├── frontend/         # React SPA
├── infra/            # Docker configs
└── README.md
```

## Documentation

- [Backend README](./backend/README.md) - API details, endpoints, architecture
- [Frontend README](./frontend/README.md) - Components, state management
- [Improvements](./IMPROVEMENTS.md) - Technical improvements made
- [Deployment Guide](./DEPLOYMENT.md) - How to host in production
- [Deploy Checklist](./DEPLOY_CHECKLIST.md) - Step-by-step deployment checklist

## Sample Queries

Try these natural language queries:

| Query | Description |
|-------|-------------|
| "How many users signed up this month?" | Count with date filter |
| "Show top 10 products by sales" | Sorting and limiting |
| "Total revenue from completed orders" | Aggregation |
| "Active customers who spent over $1000" | Multiple filters |
| "Average order value by status" | Group by with aggregation |

## Switching Databases

### Use PostgreSQL instead of MongoDB:

1. Start PostgreSQL:
```bash
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=askyourdb \
  postgres:15-alpine
```

2. Update `backend/.env`:
```env
DB_ENGINE=postgres
```

3. Seed PostgreSQL:
```bash
npm run seed:postgres
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection fails | Use `127.0.0.1` instead of `localhost` in MONGO_URI |
| LLM errors | Check API key is valid and has credits |
| CORS errors | Ensure backend is running on port 4000 |
| Auth issues | Clear browser localStorage and re-login |

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

## License

MITMIT
