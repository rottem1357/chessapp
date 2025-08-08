# Test Review & Improvement Plan

## Current Test Status Analysis

### ✅ **What's Working Well:**
- **Good test structure**: Tests organized by domain (auth, games, ai, etc.)
- **Helper functions**: `createTestUser`, `generateToken`, etc.
- **Comprehensive coverage**: Tests exist for most major endpoints
- **Proper setup**: Database setup and teardown handled

### ❌ **Issues Found:**

#### 1. **Response Format Mismatch**
**Problem**: Test helpers expect old response format
```javascript
// Current (WRONG)
function expectErrorResponse(response, expectedCode = null) {
  expect(response.body).toHaveProperty('error_code'); // OLD FORMAT
}

// Should be (NEW)
function expectErrorResponse(response, expectedCode = null) {
  expect(response.body).toHaveProperty('errorCode'); // NEW FORMAT
  expect(response.body).toHaveProperty('timestamp');
}
```

#### 2. **Missing Unified Response Validation**
Tests don't verify the new unified response structure:
```javascript
{
  "success": boolean,
  "message": string,
  "data": any,
  "errorCode": string, // for errors
  "timestamp": ISO_date
}
```

#### 3. **Incomplete Input/Output Testing**
Many tests don't verify:
- Complete response data structure
- All required fields in responses
- Proper error codes
- Timestamp presence

---

## 🔧 Test Helper Updates Needed

### Fix Response Validation Functions

**File**: `tests/helpers/testHelpers.js`

```javascript
/**
 * Assert valid success response structure
 */
function expectValidResponse(response, expectedData = null) {
  expect(response.body).toHaveProperty('success', true);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
  expect(response.body).toHaveProperty('timestamp');
  
  // Validate timestamp format
  expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  
  if (expectedData) {
    expect(response.body.data).toMatchObject(expectedData);
  }
}

/**
 * Assert valid error response structure
 */
function expectErrorResponse(response, expectedCode = null) {
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data', null);
  expect(response.body).toHaveProperty('errorCode');
  expect(response.body).toHaveProperty('timestamp');
  
  // Validate timestamp format
  expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  
  if (expectedCode) {
    expect(response.body.errorCode).toBe(expectedCode);
  }
}

/**
 * Assert pagination structure
 */
function expectPagination(response, expectedTotal = null) {
  expect(response.body.data).toHaveProperty('pagination');
  const pagination = response.body.data.pagination;
  
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('pages');
  expect(pagination).toHaveProperty('hasNext');
  expect(pagination).toHaveProperty('hasPrev');
  
  if (expectedTotal !== null) {
    expect(pagination.total).toBe(expectedTotal);
  }
}

/**
 * Validate authentication token format
 */
function expectValidToken(token) {
  expect(typeof token).toBe('string');
  expect(token.length).toBeGreaterThan(50);
  // JWT tokens have 3 parts separated by dots
  expect(token.split('.')).toHaveLength(3);
}

/**
 * Validate UUID format
 */
function expectValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  expect(uuid).toMatch(uuidRegex);
}
```

---

## 📝 Test Template for New Endpoints

```javascript
describe('POST /api/games', () => {
  let user, token;

  beforeEach(async () => {
    user = await createTestUser();
    token = generateToken(user.id);
  });

  describe('Success Cases', () => {
    it('should create game with valid input', async () => {
      const gameData = {
        game_type: 'rapid',
        time_control: '10+5',
        is_rated: true
      };

      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send(gameData)
        .expect(201);

      // Validate response structure
      expectValidResponse(response);
      
      // Validate specific data
      expect(response.body.data).toHaveProperty('id');
      expectValidUUID(response.body.data.id);
      expect(response.body.data.game_type).toBe('rapid');
      expect(response.body.data.status).toBe('waiting');
      expect(response.body.data.creator_id).toBe(user.id);
    });
  });

  describe('Validation Errors', () => {
    it('should reject invalid game_type', async () => {
      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ game_type: 'invalid' })
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
      expect(response.body.message).toContain('Invalid game type');
    });

    it('should reject missing required fields', async () => {
      const response = await request(app)
        .post('/api/games')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expectErrorResponse(response, 'VALIDATION_001');
    });
  });

  describe('Authentication Errors', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/games')
        .send({ game_type: 'rapid' })
        .expect(401);

      expectErrorResponse(response, 'AUTH_001');
    });

    it('should reject invalid tokens', async () => {
      const response = await request(app)
        .post('/api/games')
        .set('Authorization', 'Bearer invalid_token')
        .send({ game_type: 'rapid' })
        .expect(401);

      expectErrorResponse(response, 'AUTH_001');
    });
  });
});
```

---

## 🎯 Priority Test Fixes

### 1. **Update All Test Files** (High Priority)
Files that need updating:
- `tests/helpers/testHelpers.js` - Fix response validators
- `tests/auth/auth.test.js` - Update for new response format
- `tests/games/games.test.js` - Add comprehensive input/output tests
- `tests/ai/ai.test.js` - Verify AI difficulty responses
- All other test files - Update response expectations

### 2. **Add Missing Test Coverage** (Medium Priority)
**Missing Tests:**
- Pagination validation on list endpoints
- Complete error code validation
- Response timing (timestamp validation)
- Edge cases for all endpoints
- Admin endpoint authorization tests

### 3. **Integration Tests** (Medium Priority)
**Needed:**
- Full game flow tests (create → join → play → finish)
- Authentication flow tests (register → login → access protected)
- Real-time features (if using WebSockets)

### 4. **Performance Tests** (Low Priority)
- Load testing for critical endpoints
- Database query optimization validation
- Response time benchmarks

---

## 🧪 Test Execution Commands

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- tests/auth/
npm test -- tests/games/

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (development)
npm run test:watch
```

---

## ✅ Test Quality Checklist

For each endpoint test, ensure:

- [ ] **Response Structure**: Validates unified response format
- [ ] **Success Cases**: Tests valid inputs and expected outputs
- [ ] **Validation Errors**: Tests all invalid input scenarios
- [ ] **Authentication**: Tests protected endpoints properly
- [ ] **Error Codes**: Validates specific error codes
- [ ] **Data Types**: Validates all response field types
- [ ] **Business Logic**: Tests core functionality
- [ ] **Edge Cases**: Tests boundary conditions
- [ ] **Database State**: Verifies data persistence
- [ ] **Cleanup**: Proper test data cleanup

**Next Steps**: 
1. Update test helpers with new response format
2. Run existing tests to identify failures
3. Fix test files one by one
4. Add missing test coverage
5. Verify all 49 endpoints have proper tests
