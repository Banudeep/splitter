# Splitter Application Makefile

.PHONY: help build up down logs clean restart status health

# Default target
help:
	@echo "Splitter Application Docker Commands:"
	@echo ""
	@echo "  make build     - Build all Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs for all services"
	@echo "  make status    - Show service status"
	@echo "  make health    - Check service health"
	@echo "  make clean     - Remove all containers and volumes"
	@echo "  make db-backup - Backup database"
	@echo "  make db-restore - Restore database from backup.sql"
	@echo ""

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Restart all services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# Show service status
status:
	docker-compose ps

# Check service health
health:
	@echo "Checking service health..."
	@echo "PostgreSQL:"
	@docker-compose exec -T postgres pg_isready -U postgres || echo "❌ PostgreSQL not ready"
	@echo "Spring Boot:"
	@curl -f http://localhost:8080/actuator/health || echo "❌ Spring Boot not ready"
	@echo "Frontend:"
	@curl -f http://localhost:3000 || echo "❌ Frontend not ready"

# Clean up everything
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Database backup
db-backup:
	docker exec splitter-postgres pg_dump -U postgres splitter > backup.sql
	@echo "Database backed up to backup.sql"

# Database restore
db-restore:
	docker exec -i splitter-postgres psql -U postgres splitter < backup.sql
	@echo "Database restored from backup.sql"

# Development commands
dev-backend:
	cd splitter && mvn spring-boot:run

dev-frontend:
	cd splitter_frontend && npm run dev

# Production deployment
deploy: build up health
	@echo "✅ Deployment complete!"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8080"
