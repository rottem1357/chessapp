# Naming Conventions and Standards

## 📝 File Naming Conventions

### Project Management Files

#### Strategic Documents
- **Format**: `[type].md`
- **Examples**:
  - `roadmap.md`
  - `architecture.md`
  - `requirements.md`
- **Location**: `strategy/` directory

#### Release Documents
- **Format**: `v[version]-[name].md`
- **Examples**:
  - `v1.0-mvp.md`
  - `v2.0-advanced.md`
  - `v3.0-mobile.md`
- **Location**: `releases/` directory

#### Epic Documents
- **Format**: `epic-[feature-name].md`
- **Examples**:
  - `epic-puzzle-system.md`
  - `epic-user-accounts.md`
  - `epic-game-analysis.md`
- **Location**: `epics/` directory

#### Assignment Files
- **Format**: `[role]-assignments.md`
- **Examples**:
  - `frontend-assignments.md`
  - `backend-assignments.md`
  - `qa-assignments.md`
  - `devops-assignments.md`
- **Location**: `assignments/` directory

#### Role Workspace Files
- **Format**: `[description].md`
- **Examples**:
  - `current-assignment-be-001.md`
  - `README.md`
  - `api-specifications.md`
- **Location**: `../[role]/` directories

### Code File Naming

#### Frontend Components
- **Format**: `PascalCase.js`
- **Examples**:
  - `GameBoard.js`
  - `UserProfile.js`
  - `PuzzleSelector.js`
- **Location**: `src/components/`

#### Backend Services
- **Format**: `camelCase.js`
- **Examples**:
  - `gameService.js`
  - `userService.js`
  - `puzzleService.js`
- **Location**: `backend/services/`

#### API Routes
- **Format**: `kebab-case.js`
- **Examples**:
  - `user-auth.js`
  - `game-rooms.js`
  - `puzzle-system.js`
- **Location**: `backend/routes/`

## 🏷️ Task and Issue Naming

### Task Categories
- **Epic**: Large feature or capability
- **Story**: User-facing functionality
- **Task**: Technical implementation work
- **Bug**: Defect or issue to fix
- **Chore**: Maintenance or administrative work

### Task Naming Format
- **Format**: `[Type] [Component]: [Description]`
- **Examples**:
  - `Epic Puzzle System: Implement tactical training`
  - `Story User Auth: Add registration form`
  - `Task Backend: Optimize database queries`
  - `Bug Frontend: Fix mobile responsive issues`
  - `Chore Docs: Update API documentation`

### Priority Levels
- **Critical**: Must be completed immediately
- **High**: Important for current milestone
- **Medium**: Nice to have for current milestone
- **Low**: Future consideration

### Status Labels
- **Backlog**: Not yet started
- **In Progress**: Currently being worked on
- **Blocked**: Waiting for dependencies
- **Review**: Ready for code review
- **Testing**: In QA testing phase
- **Done**: Completed and deployed

## 🔤 Code Naming Standards

### Variables and Functions
- **JavaScript**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private methods**: `_privateMethod`
- **Examples**:
  ```javascript
  const userName = 'john_doe';
  const MAX_RETRIES = 3;
  const API_BASE_URL = 'https://api.example.com';
  
  function calculateRating(wins, losses) {
    return _processRatingData(wins, losses);
  }
  ```

### CSS Classes
- **Format**: `kebab-case`
- **BEM Methodology**: `block__element--modifier`
- **Examples**:
  ```css
  .game-board { }
  .game-board__square { }
  .game-board__square--selected { }
  .user-profile { }
  .user-profile__avatar { }
  .user-profile__avatar--large { }
  ```

### Database Tables and Columns
- **Tables**: `snake_case` (plural)
- **Columns**: `snake_case` (singular)
- **Examples**:
  ```sql
  CREATE TABLE user_accounts (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(50),
    email_address VARCHAR(100),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  );
  ```

### API Endpoints
- **Format**: `kebab-case`
- **RESTful conventions**: Resource-based URLs
- **Examples**:
  ```
  GET /api/user-profiles
  POST /api/game-rooms
  PUT /api/puzzle-attempts/:id
  DELETE /api/tournament-registrations/:id
  ```

## 📊 Data Naming Standards

### JSON Objects
- **Keys**: `camelCase`
- **Examples**:
  ```json
  {
    "userId": 12345,
    "userName": "john_doe",
    "gameStats": {
      "totalGames": 150,
      "winRate": 0.65,
      "currentRating": 1542
    }
  }
  ```

### Database Schema
- **Tables**: `snake_case` (plural)
- **Columns**: `snake_case` (singular)
- **Indexes**: `idx_table_column`
- **Foreign Keys**: `fk_table_reference`
- **Examples**:
  ```sql
  CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    player_white_id INTEGER,
    player_black_id INTEGER,
    FOREIGN KEY (player_white_id) REFERENCES users(id),
    FOREIGN KEY (player_black_id) REFERENCES users(id)
  );
  
  CREATE INDEX idx_game_sessions_created_at ON game_sessions(created_at);
  ```

### Environment Variables
- **Format**: `UPPER_SNAKE_CASE`
- **Examples**:
  ```bash
  NODE_ENV=production
  DATABASE_URL=postgresql://localhost:5432/chess_app
  JWT_SECRET=your-secret-key
  REDIS_URL=redis://localhost:6379
  ```

## 🏗️ Component Architecture

### React Components
- **File Structure**: One component per file
- **Naming**: PascalCase for components
- **Props**: camelCase for prop names
- **Examples**:
  ```jsx
  // GameBoard.js
  export const GameBoard = ({ 
    gameState, 
    onMoveAttempt, 
    isPlayerTurn 
  }) => {
    // Component implementation
  };
  ```

### Custom Hooks
- **Format**: `use` prefix + PascalCase
- **Examples**:
  ```jsx
  // useGameState.js
  export const useGameState = (gameId) => {
    // Hook implementation
  };
  
  // useSocket.js
  export const useSocket = (serverUrl) => {
    // Hook implementation
  };
  ```

### Context Providers
- **Format**: `[Feature]Context`
- **Examples**:
  ```jsx
  // AuthContext.js
  export const AuthContext = createContext();
  export const AuthProvider = ({ children }) => {
    // Provider implementation
  };
  ```

## 🔧 Backend Architecture

### Service Classes
- **Format**: `[Feature]Service`
- **Examples**:
  ```javascript
  // gameService.js
  class GameService {
    async createGame(players) {
      // Service implementation
    }
  }
  
  export default new GameService();
  ```

### Controller Classes
- **Format**: `[Feature]Controller`
- **Examples**:
  ```javascript
  // gameController.js
  class GameController {
    async createGame(req, res) {
      // Controller implementation
    }
  }
  
  export default new GameController();
  ```

### Middleware Functions
- **Format**: `[purpose]Middleware`
- **Examples**:
  ```javascript
  // authMiddleware.js
  export const authenticateToken = (req, res, next) => {
    // Middleware implementation
  };
  
  // validationMiddleware.js
  export const validateGameMove = (req, res, next) => {
    // Middleware implementation
  };
  ```

## 📋 Documentation Standards

### Markdown Files
- **Headers**: Use descriptive, hierarchical headings
- **Code Blocks**: Always specify language
- **Links**: Use descriptive link text
- **Examples**:
  ```markdown
  # Main Title
  
  ## Section Title
  
  ### Subsection Title
  
  ```javascript
  // Code example with syntax highlighting
  const example = 'code';
  ```
  
  [Descriptive Link Text](https://example.com)
  ```

### Code Comments
- **Functions**: JSDoc format
- **Complex Logic**: Inline comments
- **Examples**:
  ```javascript
  /**
   * Calculates the new ELO rating for a player
   * @param {number} currentRating - Player's current rating
   * @param {number} opponentRating - Opponent's rating
   * @param {number} score - Game result (1 = win, 0.5 = draw, 0 = loss)
   * @returns {number} New rating
   */
  function calculateEloRating(currentRating, opponentRating, score) {
    // K-factor determines rating change sensitivity
    const kFactor = 32;
    
    // Expected score calculation
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
    
    // Return new rating
    return Math.round(currentRating + kFactor * (score - expectedScore));
  }
  ```

## 🎯 Git Standards

### Branch Naming
- **Format**: `[type]/[description]`
- **Types**: feature, bugfix, hotfix, chore
- **Examples**:
  - `feature/puzzle-system`
  - `bugfix/game-clock-sync`
  - `hotfix/auth-vulnerability`
  - `chore/update-dependencies`

### Commit Messages
- **Format**: `[type]([scope]): [description]`
- **Types**: feat, fix, docs, style, refactor, test, chore
- **Examples**:
  - `feat(auth): add user registration endpoint`
  - `fix(game): resolve move validation bug`
  - `docs(api): update authentication documentation`
  - `refactor(puzzle): optimize solution checking`

### Pull Request Titles
- **Format**: `[Type] [Component]: [Description]`
- **Examples**:
  - `Feature Puzzle System: Implement tactical training`
  - `Bugfix Game Clock: Fix synchronization issues`
  - `Docs API: Update endpoint documentation`

## 🔍 Quality Standards

### Code Quality
- **ESLint**: Enforce coding standards
- **Prettier**: Consistent code formatting
- **SonarQube**: Code quality analysis
- **Test Coverage**: Minimum 90% coverage

### Documentation Quality
- **Clarity**: Clear, concise explanations
- **Completeness**: All features documented
- **Accuracy**: Up-to-date information
- **Examples**: Practical code examples

### Performance Standards
- **Load Time**: < 2 seconds initial load
- **API Response**: < 200ms average
- **Database Queries**: < 50ms
- **Memory Usage**: < 100MB per user

---
**Last Updated**: July 13, 2025  
**Next Review**: July 20, 2025  
**Document Owner**: Development Team
