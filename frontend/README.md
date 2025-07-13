# Chess App Frontend

A modern React-based chess application frontend that supports local games, AI opponents, and real-time multiplayer matches.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Components](#components)
- [Services](#services)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [Styling](#styling)
- [Contributing](#contributing)

## ✨ Features

- **Local Chess Games**: Play offline against another person on the same device
- **AI Opponents**: Challenge computer opponents with configurable difficulty levels
- **Real-time Multiplayer**: Play online matches with real-time synchronization
- **Game Persistence**: Save and resume games using localStorage
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Chat**: Communicate with opponents during online matches
- **Move Validation**: Client-side and server-side move validation
- **Game Status Tracking**: Track check, checkmate, stalemate, and draw conditions

## 🛠 Tech Stack

- **Frontend Framework**: React 18.2.0
- **Build Tool**: Create React App with CRACO
- **Chess Engine**: chess.js
- **Chess Board**: react-chessboard
- **Real-time Communication**: Socket.io Client
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS3 with CSS Modules approach

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Chat.js         # Real-time chat component
│   ├── DifficultySelector.js  # AI difficulty selection
│   ├── GameInfo.js     # Game status and player information
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useSocket.js    # Socket.io connection management
│   └── ...
├── pages/              # Page components (routes)
│   ├── Home.js         # Main menu and game selection
│   ├── Game.js         # Online multiplayer game
│   ├── LocalGame.js    # Local two-player game
│   ├── AIGame.js       # AI opponent game
│   └── ...
├── services/           # API and external service integrations
│   ├── api.js          # HTTP API client
│   ├── gameApi.js      # Game-related API calls
│   └── ...
├── utils/              # Utility functions and helpers
│   ├── gameStorage.js  # Game persistence utilities
│   ├── constants.js    # Application constants
│   └── ...
├── App.js              # Main application component
├── App.css             # Global styles
├── index.js            # Application entry point
└── index.css           # Global CSS reset and base styles
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd chessapp/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🧩 Components

### Core Components

#### `<Chat />`
Real-time chat component for online games.

```jsx
<Chat gameId="game-123" playerColor="white" />
```

**Props:**
- `gameId` (string): Unique game identifier
- `playerColor` (string): Player's color ('white' or 'black')

#### `<DifficultySelector />`
AI difficulty selection component.

```jsx
<DifficultySelector
  selectedDifficulty="intermediate"
  onSelect={(difficulty) => setDifficulty(difficulty)}
/>
```

**Props:**
- `selectedDifficulty` (string): Currently selected difficulty
- `onSelect` (function): Callback when difficulty is selected

#### `<GameInfo />`
Displays game status and player information.

```jsx
<GameInfo
  playerColor="white"
  opponent="Alice"
  isMyTurn={true}
  gameStatus="active"
  winner={null}
/>
```

**Props:**
- `playerColor` (string): Current player's color
- `opponent` (string): Opponent's name
- `isMyTurn` (boolean): Whether it's current player's turn
- `gameStatus` (string): Current game status
- `winner` (string|null): Winner of the game if ended

## 🔧 Services

### API Service (`services/api.js`)
Centralized HTTP client for all API communications.

### Game API (`services/gameApi.js`)
Game-specific API endpoints:
- `createGame()`: Create new game
- `joinGame()`: Join existing game
- `makeMove()`: Submit move
- `getGameState()`: Fetch current game state

## 🪝 Hooks

### `useSocket`
Manages Socket.io connection and provides real-time communication.

```jsx
const socket = useSocket();

useEffect(() => {
  socket.on('game-update', handleGameUpdate);
  return () => socket.off('game-update');
}, [socket]);
```

## 🛠 Utilities

### `gameStorage.js`
Provides game persistence functionality:
- `saveGameState()`: Save game to localStorage
- `loadGameState()`: Load game from localStorage
- `clearGameState()`: Remove saved game
- `getAllSavedGames()`: Get all saved games

## 🎨 Styling

The application uses a modular CSS approach with:
- Component-specific CSS files
- Global styles in `App.css` and `index.css`
- Responsive design principles
- Consistent color scheme and typography

### CSS Class Naming Convention
- BEM methodology for component styles
- Descriptive class names
- Consistent spacing and sizing units

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add new feature'`
5. Push to the branch: `git push origin feature/new-feature`
6. Submit a pull request

### Code Style Guidelines

- Use functional components with hooks
- Follow React best practices
- Add PropTypes for type checking
- Write meaningful component and function names
- Comment complex logic
- Keep components small and focused

## 🐛 Known Issues

- [ ] AI difficulty settings need server-side validation
- [ ] Mobile responsive design needs improvement
- [ ] Game reconnection after network loss

## 🔄 Future Enhancements

- [ ] Add TypeScript support
- [ ] Implement unit and integration tests
- [ ] Add game analysis and move history
- [ ] Implement puzzle mode
- [ ] Add user authentication and profiles
- [ ] Support for different chess variants

## 🎯 Recent Improvements

### Frontend Refactoring Completed (January 2025)
- **✅ Complete Infrastructure**: Added comprehensive utilities, services, and hooks
- **✅ Design System**: Implemented CSS variables and responsive design patterns
- **✅ Enhanced Components**: All components refactored with modern React patterns
- **✅ Accessibility**: Added ARIA labels, keyboard navigation, and screen reader support
- **✅ Error Handling**: Comprehensive error handling with user-friendly messages
- **✅ Performance**: Optimized components with React.memo and useCallback
- **✅ Documentation**: Complete component documentation with props and usage examples

### Component Enhancements
- **Chat.js**: Real-time messaging with typing indicators and enhanced UX
- **DifficultySelector.js**: Detailed AI difficulty selection with stats and descriptions
- **GameInfo.js**: Comprehensive game status display with player information and statistics
- **Home.js**: Enhanced game mode selection with improved validation and UX
- **Game.js**: Refactored multiplayer game interface with better state management

### Technical Improvements
- **Modern React Patterns**: All components use hooks and functional patterns
- **Type Safety**: Comprehensive prop validation and error boundaries
- **Performance**: Optimized rendering and state management
- **Maintainability**: Clean code structure with consistent naming and patterns

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
