set -e

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

echo "Building Auth Service Docker image..."
echo "Version: $VERSION"
echo "Build Date: $BUILD_DATE"
echo "VCS Ref: $VCS_REF"

# Build the image
docker build \
  --build-arg BUILD_DATE="$BUILD_DATE" \
  --build-arg VCS_REF="$VCS_REF" \
  --build-arg VERSION="$VERSION" \
  -t chess-auth-service:latest \
  -t chess-auth-service:$VERSION \
  .

echo "Build completed successfully!"
echo "Images tagged as:"
echo "  - chess-auth-service:latest"
echo "  - chess-auth-service:$VERSION"