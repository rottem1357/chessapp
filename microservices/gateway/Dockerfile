# microservices/gateway/Dockerfile
FROM node:18.20.2-alpine

# Update package lists and upgrade packages to reduce vulnerabilities
RUN apk update && apk upgrade --no-cache

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Run the application
CMD ["npm", "start"]
