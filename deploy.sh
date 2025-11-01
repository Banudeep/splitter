#!/bin/bash

# Splitter Application Docker Deployment Script

set -e

echo "🚀 Starting Splitter Application Deployment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install docker-compose."
    exit 1
fi

echo "✅ Docker is running"

# Stop existing containers if they exist
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to start..."
sleep 10

# Check service health
echo "🔍 Checking service health..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
    docker-compose logs postgres
    exit 1
fi

# Check Spring Boot app
if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
    echo "✅ Spring Boot application is ready"
else
    echo "❌ Spring Boot application is not ready"
    docker-compose logs splitter-app
    exit 1
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is ready"
else
    echo "❌ Frontend is not ready"
    docker-compose logs splitter-frontend
    exit 1
fi

echo ""
echo "🎉 Deployment successful!"
echo ""
echo "📱 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8080"
echo "   Database: localhost:5432"
echo ""
echo "📊 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   View status: docker-compose ps"
echo ""
echo "🔧 Database management:"
echo "   Connect: docker exec -it splitter-postgres psql -U postgres -d splitter"
echo "   Backup: docker exec splitter-postgres pg_dump -U postgres splitter > backup.sql"
echo ""
