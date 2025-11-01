# Splitter Application - Docker Deployment

This repository contains a bill splitting application with Spring Boot backend and React frontend, containerized with Docker.

## Architecture

- **Backend**: Spring Boot 3.5.6 with Java 21
- **Frontend**: React with Vite
- **Database**: PostgreSQL 15
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker Desktop installed
- Docker Compose v3.8+

### Running the Application

1. **Clone and navigate to the project directory:**

   ```bash
   git clone <repository-url>
   cd splitter
   ```

2. **Start all services:**

   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8080
   - Database: localhost:5432

### Individual Service Commands

**Build and run backend only:**

```bash
cd splitter
docker build -t splitter-backend .
docker run -p 8080:8080 splitter-backend
```

**Build and run frontend only:**

```bash
cd splitter_frontend
docker build -t splitter-frontend .
docker run -p 3000:3000 splitter-frontend
```

**Run database only:**

```bash
docker run -d \
  --name splitter-postgres \
  -e POSTGRES_DB=splitter \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=hello \
  -p 5432:5432 \
  postgres:15-alpine
```

## Environment Variables

### Backend (Spring Boot)

- `SPRING_DATASOURCE_URL`: Database connection URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `OPENAI_API_KEY`: OpenAI API key for OCR functionality

### Frontend (React)

- `REACT_APP_API_URL`: Backend API URL

## Development

### Local Development Setup

1. **Start database:**

   ```bash
   docker-compose up postgres -d
   ```

2. **Run backend locally:**

   ```bash
   cd splitter
   mvn spring-boot:run
   ```

3. **Run frontend locally:**
   ```bash
   cd splitter_frontend
   npm install
   npm run dev
   ```

## Production Deployment

### Using Docker Compose (Recommended)

1. **Update environment variables in docker-compose.yml**
2. **Deploy:**
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

### Using Docker Swarm

1. **Initialize swarm:**

   ```bash
   docker swarm init
   ```

2. **Deploy stack:**
   ```bash
   docker stack deploy -c docker-compose.yml splitter
   ```

### Using Kubernetes

Convert docker-compose.yml to Kubernetes manifests using kompose:

```bash
kompose convert
kubectl apply -f .
```

## Monitoring and Logs

**View logs:**

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f splitter-app
docker-compose logs -f splitter-frontend
docker-compose logs -f postgres
```

**Health checks:**

```bash
# Backend health
curl http://localhost:8080/actuator/health

# Frontend
curl http://localhost:3000
```

## Database Management

**Connect to database:**

```bash
docker exec -it splitter-postgres psql -U postgres -d splitter
```

**Backup database:**

```bash
docker exec splitter-postgres pg_dump -U postgres splitter > backup.sql
```

**Restore database:**

```bash
docker exec -i splitter-postgres psql -U postgres splitter < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port conflicts:**

   - Change ports in docker-compose.yml if 3000, 8080, or 5432 are in use

2. **Database connection issues:**

   - Ensure PostgreSQL container is healthy: `docker-compose ps`
   - Check logs: `docker-compose logs postgres`

3. **Build failures:**

   - Clear Docker cache: `docker system prune -a`
   - Rebuild: `docker-compose build --no-cache`

4. **Frontend not connecting to backend:**
   - Verify REACT_APP_API_URL environment variable
   - Check nginx proxy configuration

### Performance Optimization

1. **Multi-stage builds** reduce image size
2. **Layer caching** speeds up rebuilds
3. **Health checks** ensure service reliability
4. **Resource limits** prevent resource exhaustion

## Security Considerations

- Non-root user in containers
- Environment variables for secrets
- Security headers in nginx
- Database credentials in environment variables
- Regular security updates

## Scaling

**Horizontal scaling:**

```bash
docker-compose up --scale splitter-app=3
```

**Load balancing** can be added with nginx or traefik.

## Backup and Recovery

**Volume backup:**

```bash
docker run --rm -v splitter_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz -C /data .
```

**Volume restore:**

```bash
docker run --rm -v splitter_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /data
```
