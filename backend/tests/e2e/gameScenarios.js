const {
  createTestUsers,
  authenticatedRequest,
  expectValidResponse
} = require('../helpers/testHelpers');

class GameScenarios {
  constructor(app) {
    this.app = app;
  }

  async playCompleteGame() {
    // Create two players
    const [player1, player2] = await createTestUsers(2);

    // Player 1 creates a game
    const gameResponse = await authenticatedRequest(this.app, player1)
      .post('/api/games')
      .send({
        game_type: 'rapid',
        time_control: '10+0',
        is_rated: true
      });

    expectValidResponse(gameResponse);
    const gameId = gameResponse.body.data.id;

    // Player 2 joins the game
    const joinResponse = await authenticatedRequest(this.app, player2)
      .post(`/api/games/${gameId}/join`);

    expectValidResponse(joinResponse);

    // Play some moves
    const moves = [
      { player: player1, move: 'e4' },
      { player: player2, move: 'e5' },
      { player: player1, move: 'Nf3' },
      { player: player2, move: 'Nc6' },
      { player: player1, move: 'Bb5' },
      { player: player2, move: 'a6' },
      { player: player1, move: 'Ba4' },
      { player: player2, move: 'Nf6' }
    ];

    for (const { player, move } of moves) {
      const moveResponse = await authenticatedRequest(this.app, player)
        .post(`/api/games/${gameId}/moves`)
        .send({
          move,
          time_spent_ms: Math.floor(Math.random() * 10000) + 1000
        });

      expectValidResponse(moveResponse);
    }

    // Player 2 resigns
    const resignResponse = await authenticatedRequest(this.app, player2)
      .post(`/api/games/${gameId}/resign`);

    expectValidResponse(resignResponse);
    expect(resignResponse.body.data.status).toBe('finished');
    expect(resignResponse.body.data.result).toBe('white_wins');

    return {
      gameId,
      players: [player1, player2],
      finalGame: resignResponse.body.data
    };
  }

  async playGameWithDraw() {
    const [player1, player2] = await createTestUsers(2);

    // Create and join game
    const gameResponse = await authenticatedRequest(this.app, player1)
      .post('/api/games')
      .send({ game_type: 'blitz', time_control: '5+0' });

    const gameId = gameResponse.body.data.id;

    await authenticatedRequest(this.app, player2)
      .post(`/api/games/${gameId}/join`);

    // Make a few moves
    await authenticatedRequest(this.app, player1)
      .post(`/api/games/${gameId}/moves`)
      .send({ move: 'e4' });

    await authenticatedRequest(this.app, player2)
      .post(`/api/games/${gameId}/moves`)
      .send({ move: 'e5' });

    // Player 1 offers draw
    await authenticatedRequest(this.app, player1)
      .post(`/api/games/${gameId}/draw`);

    // Player 2 accepts draw
    const drawResponse = await authenticatedRequest(this.app, player2)
      .put(`/api/games/${gameId}/draw`)
      .send({ action: 'accept' });

    expectValidResponse(drawResponse);
    expect(drawResponse.body.data.status).toBe('finished');
    expect(drawResponse.body.data.result).toBe('draw');

    return {
      gameId,
      players: [player1, player2],
      finalGame: drawResponse.body.data
    };
  }

  async playAIGame() {
    const player = await createTestUsers(1)[0];

    // Create AI game
    const aiGameResponse = await authenticatedRequest(this.app, player)
      .post('/api/ai/games')
      .send({
        difficulty: 'intermediate',
        user_color: 'white'
      });

    expectValidResponse(aiGameResponse);
    const gameId = aiGameResponse.body.data.id;

    // Make some moves
    const playerMoves = ['e4', 'Nf3', 'Bb5', 'O-O'];

    for (const move of playerMoves) {
      const moveResponse = await authenticatedRequest(this.app, player)
        .post(`/api/ai/games/${gameId}/moves`)
        .send({
          move,
          time_spent_ms: Math.floor(Math.random() * 5000) + 1000
        });

      expectValidResponse(moveResponse);
      expect(moveResponse.body.data).toHaveProperty('userMove');
      expect(moveResponse.body.data).toHaveProperty('aiMove');
    }

    return {
      gameId,
      player,
      aiDifficulty: 'intermediate'
    };
  }

  async testFriendChallenge() {
    const [user1, user2] = await createTestUsers(2);

    // Send friend request
    const friendRequestResponse = await authenticatedRequest(this.app, user1)
      .post('/api/friends/requests')
      .send({
        user_id: user2.id,
        message: 'Let\'s be friends!'
      });

    expectValidResponse(friendRequestResponse);
    const requestId = friendRequestResponse.body.data.id;

    // Accept friend request
    await authenticatedRequest(this.app, user2)
      .put(`/api/friends/requests/${requestId}`)
      .send({ action: 'accept' });

    // Challenge friend to game
    const challengeResponse = await authenticatedRequest(this.app, user1)
      .post(`/api/friends/${user2.id}/challenge`)
      .send({
        game_type: 'rapid',
        time_control: '15+10',
        color: 'white',
        message: 'Ready for a game?'
      });

    expectValidResponse(challengeResponse);

    return {
      challenger: user1,
      challenged: user2,
      invitation: challengeResponse.body.data
    };
  }
}

module.exports = GameScenarios;
