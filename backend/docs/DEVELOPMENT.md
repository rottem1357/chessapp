# Chess App Backend Development Guide

## Overview

This guide provides information for developers working on the Chess App Backend.

## Project Structure

```
backend/
├── config/               # Configuration management
│   └── index.js         # Main configuration file
├── controllers/         # Request handlers
│   ├── aiController.js  # AI game controller
│   └── gameController.js # Multiplayer game controller
├── middleware/          # Express middleware
│   ├── errorHandler.js  # Error handling middleware
│   ├── requestLogger.js # Request logging middleware
│   └── validation.js    # Input validation middleware
├── routes/              # API route definitions
│   ├── aiGame.js        # AI game routes
│   └── games.js         # Multiplayer game routes
├── services/            # Business logic services
│   ├── aiService.js     # AI opponent service
│   ├── gameService.js   # Multiplayer game service
│   └── socketService.js # WebSocket communication service
├── utils/               # Utility functions
│   ├── constants.js     # Application constants
│   ├── helpers.js       # Helper functions
│   └── logger.js        # Logging utility
├── docs/                # Documentation
│   └── API.md          # API documentation
├── tests/               # Test files
│   └── api.test.js     # API tests
├── server.js            # Main application entry point
├── package.json         # Dependencies and scripts
├── .env.example         # Environment variables template
└── README.md            # Project documentation
```

## Architecture Principles

### 1. Separation of Concerns
- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic
- **Middleware**: Handle cross-cutting concerns
- **Utils**: Provide reusable utility functions

### 2. Error Handling
- Centralized error handling in middleware
- Consistent error response format
- Proper logging of errors

### 3. Configuration Management
- Environment-based configuration
- Centralized configuration object
- Validation of required configuration

### 4. Logging
- Structured logging with JSON format
- Different log levels (error, warn, info, debug)
- Request/response logging in development

## Development Workflow

### 1. Setup
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables as needed
nano .env
```

### 2. Running the Application
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### 3. Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage
```

### 4. Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Adding New Features

### 1. API Endpoints

When adding new API endpoints:

1. **Define routes** in the appropriate route file (`routes/`)
2. **Create controller** methods in the appropriate controller (`controllers/`)
3. **Add validation** middleware if needed (`middleware/validation.js`)
4. **Update service** logic if needed (`services/`)
5. **Add tests** for the new endpoints (`tests/`)
6. **Update API documentation** (`docs/API.md`)

Example:
```javascript
// routes/games.js
router.get('/games/:gameId/analysis', 
  validateGameId,
  asyncHandler(getGameAnalysis)
);

// controllers/gameController.js
async function getGameAnalysis(req, res) {
  // Implementation
}
```

### 2. WebSocket Events

When adding new WebSocket events:

1. **Add event constants** to `utils/constants.js`
2. **Add event handlers** to `services/socketService.js`
3. **Update documentation** with new events
4. **Add tests** if applicable

### 3. AI Improvements

When improving AI functionality:

1. **Modify AI algorithms** in `services/aiService.js`
2. **Add new difficulty levels** if needed
3. **Update configuration** for new AI parameters
4. **Test AI behavior** thoroughly

## Configuration

### Environment Variables

All configuration is managed through environment variables. See `.env.example` for available options.

Key configuration areas:
- **Server**: Port, host, environment
- **Database**: Connection settings (future use)
- **Socket.IO**: WebSocket configuration
- **Game Logic**: Timeouts, limits, etc.
- **AI**: Difficulty settings, performance limits
- **Logging**: Level, file settings
- **Security**: CORS, rate limiting

### Adding New Configuration

1. Add variable to `.env.example`
2. Add to configuration object in `config/index.js`
3. Add validation if required
4. Document the new setting

## Error Handling

### Error Types

1. **Validation Errors**: Input validation failures
2. **Business Logic Errors**: Game rule violations
3. **System Errors**: Database, network, etc.
4. **Authentication Errors**: Future use

### Error Response Format

```javascript
{
  success: false,
  message: "Human-readable error message",
  code: "ERROR_CODE" // Optional machine-readable code
}
```

### Adding New Error Types

1. Add error constants to `utils/constants.js`
2. Use appropriate HTTP status codes
3. Ensure errors don't leak sensitive information
4. Log errors appropriately

## Testing Strategy

### Test Types

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test API endpoints
3. **Socket Tests**: Test WebSocket functionality

### Test Structure

```javascript
describe('Feature Name', () => {
  describe('Method/Endpoint', () => {
    it('should do something specific', async () => {
      // Test implementation
    });
  });
});
```

### Test Data

- Use realistic test data
- Clean up after tests
- Mock external dependencies

## Performance Considerations

### 1. Memory Management
- Clean up old games automatically
- Limit concurrent AI games
- Monitor memory usage

### 2. CPU Usage
- Limit AI thinking time
- Use efficient algorithms
- Consider worker threads for heavy computation

### 3. Network
- Minimize WebSocket message size
- Use appropriate timeouts
- Implement rate limiting

## Security Considerations

### 1. Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use appropriate validation libraries

### 2. Error Handling
- Don't expose internal errors
- Log security-relevant events
- Use appropriate HTTP status codes

### 3. Rate Limiting
- Implement API rate limiting
- Protect against DoS attacks
- Monitor unusual activity

## Debugging

### 1. Logging
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

### 2. Development Tools
- Use nodemon for auto-reload
- Use debugger breakpoints
- Monitor network requests

### 3. Common Issues
- Check environment variables
- Verify service dependencies
- Review error logs

## Deployment

### 1. Environment Setup
- Set production environment variables
- Configure proper logging
- Set up monitoring

### 2. Process Management
- Use PM2 or similar for process management
- Configure graceful shutdowns
- Set up health checks

### 3. Monitoring
- Monitor server health
- Track game statistics
- Set up alerting

## Contributing

### 1. Code Style
- Follow existing patterns
- Use meaningful variable names
- Add comments for complex logic

### 2. Git Workflow
- Create feature branches
- Write descriptive commit messages
- Review code before merging

### 3. Documentation
- Update documentation with changes
- Add inline code comments
- Update API documentation

## Future Enhancements

### Planned Features
1. **User Authentication**: JWT-based auth system
2. **Game Persistence**: Database storage
3. **Advanced AI**: Integration with stronger engines
4. **Game Analysis**: Position analysis and suggestions
5. **Tournament System**: Organized competitions
6. **Spectator Mode**: Watch ongoing games
7. **Chat Improvements**: Better moderation
8. **Mobile Support**: Optimized for mobile clients

### Technical Improvements
1. **Caching**: Redis for game state caching
2. **Scaling**: Horizontal scaling support
3. **Metrics**: Performance monitoring
4. **Testing**: Comprehensive test coverage
5. **Documentation**: API documentation generation
6. **CI/CD**: Automated testing and deployment
