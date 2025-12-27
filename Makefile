.PHONY: help dev dev-up dev-down dev-logs prod prod-up prod-down prod-logs build clean seed backup

# Default target
help:
	@echo "AskYourDB Docker Management"
	@echo ""
	@echo "Development:"
	@echo "  make dev        - Start development environment"
	@echo "  make dev-down   - Stop development environment"
	@echo "  make dev-logs   - View development logs"
	@echo "  make dev-build  - Rebuild development containers"
	@echo ""
	@echo "Production:"
	@echo "  make prod       - Start production environment"
	@echo "  make prod-down  - Stop production environment"
	@echo "  make prod-logs  - View production logs"
	@echo "  make prod-build - Rebuild production containers"
	@echo ""
	@echo "Maintenance:"
	@echo "  make seed       - Seed database with sample data"
	@echo "  make backup     - Backup databases"
	@echo "  make clean      - Clean up Docker resources"
	@echo "  make status     - Show service status"
	@echo ""

# Development Commands
dev: dev-up

dev-up:
	@echo "Starting development environment..."
	cd infra/docker && docker-compose -f docker-compose.dev.yml up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:4000"

dev-down:
	@echo "Stopping development environment..."
	cd infra/docker && docker-compose -f docker-compose.dev.yml down

dev-logs:
	cd infra/docker && docker-compose -f docker-compose.dev.yml logs -f

dev-build:
	@echo "Rebuilding development containers..."
	cd infra/docker && docker-compose -f docker-compose.dev.yml up -d --build

dev-restart:
	cd infra/docker && docker-compose -f docker-compose.dev.yml restart

# Production Commands
prod: prod-up

prod-up:
	@echo "Starting production environment..."
	@if [ ! -f infra/docker/.env ]; then \
		echo "Error: .env file not found!"; \
		echo "Copy .env.example to .env and configure it first."; \
		exit 1; \
	fi
	cd infra/docker && docker-compose -f docker-compose.prod.yml up -d
	@echo "Production services started!"
	@echo "Application: http://localhost"

prod-down:
	@echo "Stopping production environment..."
	cd infra/docker && docker-compose -f docker-compose.prod.yml down

prod-logs:
	cd infra/docker && docker-compose -f docker-compose.prod.yml logs -f

prod-build:
	@echo "Building production images..."
	cd infra/docker && docker-compose -f docker-compose.prod.yml build --no-cache

prod-restart:
	cd infra/docker && docker-compose -f docker-compose.prod.yml restart

# Maintenance Commands
status:
	@echo "=== Development Services ==="
	@cd infra/docker && docker-compose -f docker-compose.dev.yml ps 2>/dev/null || echo "Not running"
	@echo ""
	@echo "=== Production Services ==="
	@cd infra/docker && docker-compose -f docker-compose.prod.yml ps 2>/dev/null || echo "Not running"

seed:
	@echo "Seeding development databases..."
	@echo "Seeding MongoDB..."
	@docker exec -i askyourdb-mongo mongosh -u admin -p password123 --authenticationDatabase admin askyourdb < infra/docker/seed-mongo.js
	@echo "Seeding PostgreSQL..."
	@docker exec -i askyourdb-postgres psql -U postgres -d askyourdb < infra/docker/seed-postgres.sql
	@echo "✅ Development databases seeded successfully"

seed-prod:
	@echo "Seeding production databases..."
	@echo "Seeding MongoDB..."
	@docker exec -i askyourdb-mongo-prod mongosh -u admin -p password123 --authenticationDatabase admin askyourdb < infra/docker/seed-mongo.js
	@echo "Seeding PostgreSQL..."
	@docker exec -i askyourdb-postgres-prod psql -U postgres -d askyourdb < infra/docker/seed-postgres.sql
	@echo "✅ Production databases seeded successfully"

backup:
	@echo "Backing up MongoDB..."
	@mkdir -p backups
	docker exec askyourdb-mongo mongodump --archive=/data/backup-$$(date +%Y%m%d-%H%M%S).archive
	docker cp askyourdb-mongo:/data/backup-*.archive ./backups/
	@echo "Backup saved to ./backups/"

backup-prod:
	@echo "Backing up production MongoDB..."
	@mkdir -p backups
	docker exec askyourdb-mongo-prod mongodump --archive=/data/backup-$$(date +%Y%m%d-%H%M%S).archive
	docker cp askyourdb-mongo-prod:/data/backup-*.archive ./backups/
	@echo "Backup saved to ./backups/"

clean:
	@echo "Cleaning up Docker resources..."
	docker system prune -f
	@echo "Cleanup complete!"

clean-all:
	@echo "WARNING: This will remove all containers, images, and volumes!"
	@read -p "Are you sure? (y/N) " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		cd infra/docker && docker-compose -f docker-compose.dev.yml down -v; \
		cd infra/docker && docker-compose -f docker-compose.prod.yml down -v; \
		docker system prune -af --volumes; \
	fi

# Health Checks
health:
	@echo "Checking service health..."
	@curl -s http://localhost:4000/health | jq . 2>/dev/null || echo "Backend not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: OK" || echo "Frontend: Not responding"

health-prod:
	@echo "Checking production service health..."
	@curl -s http://localhost/health | jq . 2>/dev/null || echo "Backend not responding"
	@curl -s http://localhost > /dev/null && echo "Frontend: OK" || echo "Frontend: Not responding"

# Logs
logs-backend:
	docker logs -f askyourdb-backend

logs-frontend:
	docker logs -f askyourdb-frontend

logs-mongo:
	docker logs -f askyourdb-mongo

# Shell Access
shell-backend:
	docker exec -it askyourdb-backend sh

shell-frontend:
	docker exec -it askyourdb-frontend sh

shell-mongo:
	docker exec -it askyourdb-mongo mongosh

shell-backend-prod:
	docker exec -it askyourdb-backend-prod sh

shell-frontend-prod:
	docker exec -it askyourdb-frontend-prod sh

shell-mongo-prod:
	docker exec -it askyourdb-mongo-prod mongosh

# Quick Start
quickstart:
	@echo "AskYourDB Quick Start"
	@echo "====================="
	@if [ ! -f infra/docker/.env ]; then \
		echo "Creating .env file from template..."; \
		cp infra/docker/.env.example infra/docker/.env; \
		echo ""; \
		echo "⚠️  IMPORTANT: Edit infra/docker/.env and add your API keys!"; \
		echo ""; \
		echo "Required variables:"; \
		echo "  - GROQ_API_KEY or OPENAI_API_KEY"; \
		echo "  - MONGO_PASSWORD"; \
		echo "  - JWT_SECRET"; \
		echo ""; \
		exit 1; \
	fi
	@echo "Starting development environment..."
	@make dev-up
	@echo ""
	@echo "Waiting for services to be ready..."
	@sleep 10
	@make seed
	@echo ""
	@echo "✅ AskYourDB is ready!"
	@echo ""
	@echo "Access the application:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:4000"
	@echo ""
	@echo "Default login credentials:"
	@echo "  Email:    admin@example.com"
	@echo "  Password: password123"
