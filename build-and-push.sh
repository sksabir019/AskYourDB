#!/bin/bash

# Build and push Docker images to registry
# Usage: ./build-and-push.sh <registry> <version>
# Example: ./build-and-push.sh dockerhub 1.0.0
# Example: ./build-and-push.sh ghcr v1.0.0

set -e

# Configuration
REGISTRY="${1:-dockerhub}"
VERSION="${2:-latest}"
DOCKER_USERNAME="${DOCKER_USERNAME:-yourusername}"
IMAGE_PREFIX=""

# Determine registry and image prefix
case "$REGISTRY" in
  dockerhub)
    IMAGE_PREFIX="$DOCKER_USERNAME"
    REGISTRY_URL=""
    echo "📦 Using Docker Hub: hub.docker.com"
    ;;
  ghcr)
    IMAGE_PREFIX="ghcr.io/$DOCKER_USERNAME"
    REGISTRY_URL="ghcr.io"
    echo "📦 Using GitHub Container Registry"
    ;;
  *)
    echo "❌ Unknown registry: $REGISTRY"
    echo "Usage: $0 <registry> <version>"
    echo "Registries: dockerhub, ghcr"
    exit 1
    ;;
esac

BACKEND_IMAGE="${IMAGE_PREFIX}/askyourdb-backend"
FRONTEND_IMAGE="${IMAGE_PREFIX}/askyourdb-frontend"

echo "🏗️  Building images..."
echo "Backend:  $BACKEND_IMAGE:$VERSION"
echo "Frontend: $FRONTEND_IMAGE:$VERSION"
echo ""

# Build backend
echo "🔨 Building backend..."
docker build -t "$BACKEND_IMAGE:$VERSION" -t "$BACKEND_IMAGE:latest" \
  -f infra/docker/backend.Dockerfile \
  backend/

# Build frontend
echo "🔨 Building frontend..."
docker build -t "$FRONTEND_IMAGE:$VERSION" -t "$FRONTEND_IMAGE:latest" \
  -f infra/docker/frontend.Dockerfile \
  frontend/

echo ""
echo "✅ Images built successfully!"
echo ""
echo "📋 Local images:"
docker images | grep askyourdb

echo ""
read -p "🚀 Push images to registry? (y/N) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Login check
  echo "🔐 Checking registry login..."
  if [ "$REGISTRY" == "dockerhub" ]; then
    docker login || exit 1
  else
    docker login "$REGISTRY_URL" || exit 1
  fi

  echo ""
  echo "📤 Pushing backend..."
  docker push "$BACKEND_IMAGE:$VERSION"
  docker push "$BACKEND_IMAGE:latest"

  echo ""
  echo "📤 Pushing frontend..."
  docker push "$FRONTEND_IMAGE:$VERSION"
  docker push "$FRONTEND_IMAGE:latest"

  echo ""
  echo "✅ Images pushed successfully!"
  echo ""
  echo "🎉 Published images:"
  echo "   $BACKEND_IMAGE:$VERSION"
  echo "   $BACKEND_IMAGE:latest"
  echo "   $FRONTEND_IMAGE:$VERSION"
  echo "   $FRONTEND_IMAGE:latest"
  echo ""
  echo "📖 To use these images:"
  echo "   docker pull $BACKEND_IMAGE:$VERSION"
  echo "   docker pull $FRONTEND_IMAGE:$VERSION"
else
  echo ""
  echo "⏭️  Skipped pushing. Images are built locally."
  echo ""
  echo "To push later:"
  echo "  docker push $BACKEND_IMAGE:$VERSION"
  echo "  docker push $FRONTEND_IMAGE:$VERSION"
fi

echo ""
echo "✨ Done!"
