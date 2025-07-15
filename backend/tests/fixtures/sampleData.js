const sampleUsers = [
  {
    username: 'grandmaster1',
    email: 'gm1@chess.com',
    display_name: 'Grandmaster One',
    country: 'US',
    rating_rapid: 2400,
    rating_blitz: 2350,
    rating_bullet: 2200,
    games_played: 500,
    games_won: 320,
    games_lost: 150,
    games_drawn: 30
  },
  {
    username: 'master2',
    email: 'master2@chess.com',
    display_name: 'International Master',
    country: 'RU',
    rating_rapid: 2200,
    rating_blitz: 2180,
    rating_bullet: 2100,
    games_played: 300,
    games_won: 180,
    games_lost: 100,
    games_drawn: 20
  },
  {
    username: 'expert3',
    email: 'expert3@chess.com',
    display_name: 'Chess Expert',
    country: 'IN',
    rating_rapid: 2000,
    rating_blitz: 1950,
    rating_bullet: 1900,
    games_played: 200,
    games_won: 110,
    games_lost: 80,
    games_drawn: 10
  },
  {
    username: 'intermediate4',
    email: 'inter4@chess.com',
    display_name: 'Intermediate Player',
    country: 'BR',
    rating_rapid: 1600,
    rating_blitz: 1580,
    rating_bullet: 1550,
    games_played: 150,
    games_won: 75,
    games_lost: 65,
    games_drawn: 10
  },
  {
    username: 'beginner5',
    email: 'begin5@chess.com',
    display_name: 'Beginner Player',
    country: 'DE',
    rating_rapid: 1200,
    rating_blitz: 1180,
    rating_bullet: 1150,
    games_played: 50,
    games_won: 20,
    games_lost: 25,
    games_drawn: 5
  }
];

const sampleGames = [
  {
    game_type: 'rapid',
    time_control: '15+10',
    time_limit_seconds: 900,
    increment_seconds: 10,
    status: 'finished',
    result: 'white_wins',
    result_reason: 'checkmate',
    is_rated: true,
    move_count: 45
  },
  {
    game_type: 'blitz',
    time_control: '5+0',
    time_limit_seconds: 300,
    increment_seconds: 0,
    status: 'finished',
    result: 'black_wins',
    result_reason: 'resignation',
    is_rated: true,
    move_count: 32
  },
  {
    game_type: 'bullet',
    time_control: '1+0',
    time_limit_seconds: 60,
    increment_seconds: 0,
    status: 'finished',
    result: 'draw',
    result_reason: 'stalemate',
    is_rated: true,
    move_count: 67
  },
  {
    game_type: 'classical',
    time_control: '90+30',
    time_limit_seconds: 5400,
    increment_seconds: 30,
    status: 'active',
    is_rated: true,
    move_count: 15
  },
  {
    game_type: 'rapid',
    time_control: '10+0',
    time_limit_seconds: 600,
    increment_seconds: 0,
    status: 'waiting',
    is_rated: false,
    is_private: true,
    password: 'secret123'
  }
];

const samplePuzzles = [
  {
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4',
    moves: 'd1h5,g6,h5f7', // Scholar's mate threat
    rating: 800,
    themes: ['fork', 'attack'],
    popularity: 1500,
    success_rate: 75.5
  },
  {
    fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 3',
    moves: 'f3g5,d8f6,g5f7', // Knight fork
    rating: 1200,
    themes: ['fork', 'knight'],
    popularity: 2000,
    success_rate: 68.2
  },
  {
    fen: '8/8/8/8/8/8/6k1/4K2R w K - 0 1',
    moves: 'h1h8,g2f3,h8f8', // Back rank mate
    rating: 1500,
    themes: ['mate_in_3', 'back_rank'],
    popularity: 1200,
    success_rate: 45.8
  },
  {
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 0 4',
    moves: 'c4f7,e8f7,d1h5', // Sacrifice and attack
    rating: 1800,
    themes: ['sacrifice', 'attack', 'tactics'],
    popularity: 800,
    success_rate: 32.1
  },
  {
    fen: '8/8/8/3k4/8/3K4/8/7R w - - 0 1',
    moves: 'h1h5,d5c6,h5c5', // Rook endgame
    rating: 2000,
    themes: ['endgame', 'rook'],
    popularity: 500,
    success_rate: 28.7
  }
];

const sampleOpenings = [
  {
    eco_code: 'B90',
    name: 'Sicilian Defense',
    variation: 'Najdorf Variation',
    moves: '1.e4 c5 2.Nf3 d6 3.d4 cxd4 4.Nxd4 Nf6 5.Nc3 a6',
    fen: 'rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6',
    move_count: 5,
    popularity: 15000,
    white_wins: 7200,
    black_wins: 6800,
    draws: 1000
  },
  {
    eco_code: 'E90',
    name: 'King\'s Indian Defense',
    variation: 'Normal Variation',
    moves: '1.d4 Nf6 2.c4 g6 3.Nc3 Bg7 4.e4 d6 5.Nf3 O-O',
    fen: 'rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP3PPP/R1BQKB1R w KQ - 0 6',
    move_count: 5,
    popularity: 12000,
    white_wins: 6000,
    black_wins: 4800,
    draws: 1200
  },
  {
    eco_code: 'C20',
    name: 'King\'s Pawn Game',
    variation: 'King\'s Pawn Opening',
    moves: '1.e4 e5',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2',
    move_count: 1,
    popularity: 25000,
    white_wins: 12000,
    black_wins: 10000,
    draws: 3000
  },
  {
    eco_code: 'D20',
    name: 'Queen\'s Gambit Accepted',
    variation: 'Queen\'s Gambit Accepted',
    moves: '1.d4 d5 2.c4 dxc4',
    fen: 'rnbqkbnr/ppp1pppp/8/8/2pP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3',
    move_count: 2,
    popularity: 8000,
    white_wins: 4200,
    black_wins: 2800,
    draws: 1000
  },
  {
    eco_code: 'A00',
    name: 'Polish Opening',
    variation: 'Polish Opening',
    moves: '1.b4',
    fen: 'rnbqkbnr/pppppppp/8/8/1P6/8/P1PPPPPP/RNBQKBNR b KQkq b3 0 1',
    move_count: 1,
    popularity: 500,
    white_wins: 200,
    black_wins: 250,
    draws: 50
  }
];

const gameTimeControls = {
  bullet: ['1+0', '1+1', '2+1'],
  blitz: ['3+0', '3+2', '5+0', '5+3'],
  rapid: ['10+0', '10+5', '15+10', '25+10'],
  classical: ['90+30', '120+30', '180+0']
};

const chessMoves = {
  opening: ['e4', 'e5', 'd4', 'd5', 'Nf3', 'Nc6', 'Bb5', 'a6', 'Ba4', 'Nf6'],
  middlegame: ['Nd5', 'Bxf7+', 'Qh5', 'O-O', 'Rd1', 'Be3', 'f4', 'Nh4'],
  endgame: ['Kf1', 'Kg1', 'Ra8+', 'Qd8+', 'Rxf7', 'Kh1', 'Rd7', 'Qf6']
};

const puzzleThemes = [
  'fork', 'pin', 'skewer', 'discovery', 'deflection', 'decoy',
  'sacrifice', 'mate_in_1', 'mate_in_2', 'mate_in_3', 'endgame',
  'opening', 'middlegame', 'tactics', 'strategy', 'back_rank',
  'knight', 'bishop', 'rook', 'queen', 'attack', 'defense'
];

module.exports = {
  sampleUsers,
  sampleGames,
  samplePuzzles,
  sampleOpenings,
  gameTimeControls,
  chessMoves,
  puzzleThemes
};
