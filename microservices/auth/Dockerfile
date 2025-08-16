# microservices/auth/Dockerfile
FROM node:18-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create app directory
WORKDIR /usr/src/app

# Copy package files first (for better Docker layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Create necessary directories
RUN mkdir -p logs database/migrations scripts utils services middleware controllers routes config
RUN chown -R nodejs:nodejs /usr/src/app

# Copy application code
COPY --chown=nodejs:nodejs . .

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8083

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node healthcheck.js || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Run the application
CMD ["npm", "start"]

# Build args for metadata
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION=1.0.0

# Metadata labels
LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="chess-auth-service" \
      org.label-schema.description="Authentication and user management service for Chess App" \
      org.label-schema.version=$VERSION \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.schema-version="1.0"