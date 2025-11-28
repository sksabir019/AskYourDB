# AskYourDB Backend

Express + TypeScript API for natural language database queries.

## Quick Start

```bash
npm install
cp .env.example .env    # Configure your settings
npm run seed            # Seed sample data
npm run dev             # Start dev server
```

Server runs on http://localhost:4000

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Run production build |
| `npm run seed` | Seed MongoDB with sample data |
| `npm run seed:postgres` | Seed PostgreSQL with sample data |
| `npm test` | Run tests |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login, returns JWT token

### Queries
- `POST /api/query` - Execute natural language query
- `POST /api/query/stream` - Execute with streaming response
- `GET /api/query/history` - Get query history

### Health
- `GET /health` - Full health status
- `GET /health/live` - Liveness check
- `GET /health/ready` - Readiness check

## Environment Variables

```env
# Server
PORT=4000
NODE_ENV=development

# Database
DB_ENGINE=mongo                    # mongo or postgres
MONGO_URI=mongodb://...
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=postgres
PG_DB=askyourdb

# LLM
LLM_PROVIDER=groq                  # openai or groq
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...

# Auth
JWT_SECRET=your-secret
JWT_EXPIRES_IN=1h
```

## Architecture

```
src/
├── api/
│   ├── controllers/    # Request handlers
│   └── validators/     # Input validation
├── db/
│   ├── adapters/       # MongoDB & PostgreSQL adapters
│   └── factory.ts      # Database factory
├── services/
│   └── llm/            # LLM client (OpenAI/Groq)
├── routes/             # Express routes
├── utils/              # Logger, errors, constants
└── server.ts           # Entry point
```

## Database Schema

**Collections/Tables:** `users`, `products`, `customers`, `orders`

The seed script creates:
- 100 users
- 48 products
- 150 customers
- 300 orders

## API Examples

### Register User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John"}'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response: { "token": "eyJhbGc...", "user": {...} }
```

### Execute Query
```bash
curl -X POST http://localhost:4000/api/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"question": "How many active users are there?"}'

# Response:
# {
#   "success": true,
#   "answer": "There are 82 active users in the database.",
#   "data": [{"count": 82}],
#   "meta": {"rowCount": 1, "executionTime": 245}
# }
```

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

21 tests covering controllers, error handling, and integration.
