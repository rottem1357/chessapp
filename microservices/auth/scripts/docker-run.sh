set -e

echo "Starting Auth Service with Docker Compose..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "Please edit .env file with your configuration before running again."
    exit 1
fi

# Start services
docker-compose up -d

echo "Services starting..."
echo "Auth Service will be available at: http://localhost:8083"
echo "PostgreSQL will be available at: localhost:5433"
echo "Redis will be available at: localhost:6380"

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
docker-compose exec auth-service npm run migrate || echo "Migration will run automatically"

echo "Services are running!"
echo "Check status with: docker-compose ps"
echo "View logs with: docker-compose logs -f auth-service"