@echo off
REM Splitter Application Docker Deployment Script for Windows

echo 🚀 Starting Splitter Application Deployment...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ docker-compose is not installed. Please install docker-compose.
    pause
    exit /b 1
)

echo ✅ Docker is running

REM Stop existing containers if they exist
echo 🛑 Stopping existing containers...
docker-compose down --remove-orphans

REM Build and start services
echo 🔨 Building and starting services...
docker-compose up --build -d

REM Wait for services to be healthy
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check service health
echo 🔍 Checking service health...

REM Check PostgreSQL
docker-compose exec -T postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is ready
) else (
    echo ❌ PostgreSQL is not ready
    docker-compose logs postgres
    pause
    exit /b 1
)

REM Check Spring Boot app
curl -f http://localhost:8080/actuator/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Spring Boot application is ready
) else (
    echo ❌ Spring Boot application is not ready
    docker-compose logs splitter-app
    pause
    exit /b 1
)

REM Check Frontend
curl -f http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Frontend is ready
) else (
    echo ❌ Frontend is not ready
    docker-compose logs splitter-frontend
    pause
    exit /b 1
)

echo.
echo 🎉 Deployment successful!
echo.
echo 📱 Application URLs:
echo    Frontend: http://localhost:3000
echo    Backend API: http://localhost:8080
echo    Database: localhost:5432
echo.
echo 📊 Useful commands:
echo    View logs: docker-compose logs -f
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    View status: docker-compose ps
echo.
echo 🔧 Database management:
echo    Connect: docker exec -it splitter-postgres psql -U postgres -d splitter
echo    Backup: docker exec splitter-postgres pg_dump -U postgres splitter ^> backup.sql
echo.
pause
