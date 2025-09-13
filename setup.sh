#!/bin/bash

# Setup script for Scalable Production API with Neon Database
set -e

echo "🚀 Setting up Scalable Production API with Neon Database"
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null 2>&1; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Determine which docker-compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.development .env
    echo "✅ Created .env file"
    echo ""
    echo "⚠️  IMPORTANT: Edit the .env file with your Neon credentials:"
    echo "   - NEON_API_KEY: Get from Neon dashboard → Account Settings → API Keys"
    echo "   - NEON_PROJECT_ID: Get from Neon dashboard → Project Settings → General"
    echo "   - PARENT_BRANCH_ID: Your main branch ID (usually main/master)"
    echo ""
    read -p "Press Enter when you've updated the .env file with your Neon credentials..."
fi

echo "🏗️  Building and starting development environment..."
echo "This will:"
echo "  1. Build the Docker image"
echo "  2. Start Neon Local (creates ephemeral database branch)"
echo "  3. Start your application"
echo ""

# Start the development environment
$DOCKER_COMPOSE -f docker-compose.dev.yml up --build -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if $DOCKER_COMPOSE -f docker-compose.dev.yml ps | grep -q "Up"; then
    echo ""
    echo "🎉 Success! Your development environment is running!"
    echo ""
    echo "📍 Your application is available at:"
    echo "   🌐 App: http://localhost:3000"
    echo "   💾 Database: localhost:5432 (user: neon, password: npg)"
    echo ""
    echo "🔧 Useful commands:"
    echo "   View logs:         $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f"
    echo "   Stop services:     $DOCKER_COMPOSE -f docker-compose.dev.yml down"
    echo "   Restart services:  $DOCKER_COMPOSE -f docker-compose.dev.yml restart"
    echo "   Run migrations:    $DOCKER_COMPOSE -f docker-compose.dev.yml exec app npm run db:migrate"
    echo "   Database studio:   $DOCKER_COMPOSE -f docker-compose.dev.yml exec app npm run db:studio"
    echo ""
    echo "📖 For more details, see README-Docker.md"
    
    # Test the health endpoint
    echo "🏥 Testing application health..."
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo "✅ Application is healthy!"
    else
        echo "⚠️  Application might still be starting up. Check logs if issues persist."
    fi
else
    echo ""
    echo "❌ Something went wrong. Check the logs:"
    $DOCKER_COMPOSE -f docker-compose.dev.yml logs
    exit 1
fi