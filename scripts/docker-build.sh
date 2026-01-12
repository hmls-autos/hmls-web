#!/bin/bash
# Build and push Docker images locally
#
# Usage:
#   ./scripts/docker-build.sh          # Build only
#   ./scripts/docker-build.sh --push   # Build and push to registry
#
# Set REGISTRY env var for your container registry:
#   REGISTRY=ghcr.io/hmls-autos ./scripts/docker-build.sh --push

set -e

REGISTRY=${REGISTRY:-"ghcr.io/hmls-autos"}
VERSION=$(jq -r .version package.json)
PUSH=false

if [ "$1" = "--push" ]; then
  PUSH=true
fi

echo "Building images for version $VERSION"
echo ""

# Build API
echo "Building api..."
docker build -t $REGISTRY/hmls-api:$VERSION -t $REGISTRY/hmls-api:latest -f apps/api/Dockerfile .

if [ "$PUSH" = true ]; then
  echo ""
  echo "Pushing to $REGISTRY..."
  docker push $REGISTRY/hmls-api:$VERSION
  docker push $REGISTRY/hmls-api:latest
  echo ""
  echo "✓ Pushed $REGISTRY/hmls-api:$VERSION"
else
  echo ""
  echo "✓ Built locally. Run with --push to upload to registry."
fi
