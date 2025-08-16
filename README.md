# Chess App

A real-time chess application similar to chess.com, built with React and Node.js.

This project is transitioning from a monolithic backend to a microservices architecture.

## Features

- Real-time multiplayer chess games
- Automatic matchmaking
- Live chat during games
- Move validation using chess.js
- Responsive design
- Game resignation and status tracking

## Tech Stack

### Frontend
- React 18
- React Router DOM
- Socket.IO Client
- chess.js for game logic
- react-chessboard for the chess board component

### Backend
- Node.js
- Express.js
- Socket.IO for real-time communication
- chess.js for server-side validation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd chessapp
```

2. Install dependencies for all parts of the application
```bash
npm run install-all
```

### Development

To run both frontend and backend in development mode:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:5000
- Frontend development server on http://localhost:3000

### Individual Commands

Backend only:
```bash
npm run dev:backend
```

Frontend only:
```bash
npm run dev:frontend
```

### Production Build

```bash
npm run build
npm start
```

## How to Play

1. Open the application in your browser
2. Enter your name
3. Click "Find Match" to join the matchmaking queue
4. Wait for an opponent to be found
5. Play chess using drag and drop
6. Use the chat feature to communicate with your opponent
7. Resign if needed using the resign button

## Project Structure

```
chessapp/
├── microservices/     # Independent backend services
│   ├── gateway/            # API Gateway
│   ├── auth/               # Auth Service
│   ├── profile/            # User/Profile Service
│   ├── matchmaking/        # Matchmaking Service
│   ├── game/               # Game Service (Realtime)
│   ├── game-coordinator/   # Game Coordinator / Router
│   ├── game-persistence/   # Game Persistence Service
│   ├── rating/             # Rating Service
│   ├── spectator/          # Spectator/Playback Service
│   ├── ai/                 # AI Move Service
│   ├── analysis/           # Analysis Service
│   ├── puzzle/             # Puzzle Service
│   ├── chat/               # Chat & Presence Service
│   ├── tournament/         # Tournament Service
│   ├── clubs/              # Clubs/Teams Service
│   ├── notifications/      # Notifications Service
│   ├── fairplay/           # Fair-Play / Anti-Cheat Service
│   ├── gateway-admin/      # Gateway Admin / Config Service
│   ├── telemetry/          # Telemetry & Observability
│   └── media/              # File/Media Service
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   └── services/      # API services
│   └── public/
├── backend/           # Legacy monolith (to be decomposed)
│   ├── server.js      # Main server file
│   └── .env           # Environment variables
└── package.json       # Root package.json for scripts
```

## Future Enhancements

- User authentication and registration
- Player ratings and statistics
- Game history and replay
- Different time controls
- Tournament system
- Spectator mode
- Mobile app versions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC License
