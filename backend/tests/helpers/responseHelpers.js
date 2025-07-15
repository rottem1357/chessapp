/**
 * Validate standard API response structure
 */
function validateApiResponse(response, expectedStatus = 200) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success');
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('data');
  expect(typeof response.body.success).toBe('boolean');
  expect(typeof response.body.message).toBe('string');
}

/**
 * Validate error response structure
 */
function validateErrorResponse(response, expectedStatus = 400) {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
  expect(response.body).toHaveProperty('error_code');
  expect(typeof response.body.message).toBe('string');
  expect(typeof response.body.error_code).toBe('string');
}

/**
 * Validate paginated response structure
 */
function validatePaginatedResponse(response) {
  validateApiResponse(response);
  expect(response.body.data).toHaveProperty('items');
  expect(response.body.data).toHaveProperty('pagination');
  expect(Array.isArray(response.body.data.items)).toBe(true);
  
  const pagination = response.body.data.pagination;
  expect(pagination).toHaveProperty('page');
  expect(pagination).toHaveProperty('limit');
  expect(pagination).toHaveProperty('total');
  expect(pagination).toHaveProperty('totalPages');
  expect(typeof pagination.page).toBe('number');
  expect(typeof pagination.limit).toBe('number');
  expect(typeof pagination.total).toBe('number');
  expect(typeof pagination.totalPages).toBe('number');
}

/**
 * Validate user object structure
 */
function validateUserObject(user, includePrivateFields = false) {
  expect(user).toHaveProperty('id');
  expect(user).toHaveProperty('username');
  expect(user).toHaveProperty('display_name');
  expect(user).toHaveProperty('created_at');
  expect(typeof user.id).toBe('string');
  expect(typeof user.username).toBe('string');
  
  // Should never include password
  expect(user).not.toHaveProperty('password');
  expect(user).not.toHaveProperty('password_hash');
  
  if (!includePrivateFields) {
    expect(user).not.toHaveProperty('email');
  }
}

/**
 * Validate game object structure
 */
function validateGameObject(game) {
  expect(game).toHaveProperty('id');
  expect(game).toHaveProperty('game_type');
  expect(game).toHaveProperty('status');
  expect(game).toHaveProperty('time_control');
  expect(game).toHaveProperty('is_rated');
  expect(game).toHaveProperty('created_at');
  expect(typeof game.id).toBe('string');
  expect(['rapid', 'blitz', 'bullet', 'classical', 'correspondence', 'ai'].includes(game.game_type)).toBe(true);
  expect(['waiting', 'active', 'finished', 'aborted', 'abandoned'].includes(game.status)).toBe(true);
}

/**
 * Validate move object structure
 */
function validateMoveObject(move) {
  expect(move).toHaveProperty('id');
  expect(move).toHaveProperty('san');
  expect(move).toHaveProperty('uci');
  expect(move).toHaveProperty('move_number');
  expect(move).toHaveProperty('color');
  expect(move).toHaveProperty('created_at');
  expect(typeof move.san).toBe('string');
  expect(typeof move.uci).toBe('string');
  expect(typeof move.move_number).toBe('number');
  expect(['white', 'black'].includes(move.color)).toBe(true);
}

/**
 * Validate puzzle object structure
 */
function validatePuzzleObject(puzzle, includeSolution = false) {
  expect(puzzle).toHaveProperty('id');
  expect(puzzle).toHaveProperty('fen');
  expect(puzzle).toHaveProperty('rating');
  expect(puzzle).toHaveProperty('themes');
  expect(typeof puzzle.fen).toBe('string');
  expect(typeof puzzle.rating).toBe('number');
  expect(Array.isArray(puzzle.themes)).toBe(true);
  
  if (!includeSolution) {
    expect(puzzle).not.toHaveProperty('moves');
  }
}

module.exports = {
  validateApiResponse,
  validateErrorResponse,
  validatePaginatedResponse,
  validateUserObject,
  validateGameObject,
  validateMoveObject,
  validatePuzzleObject
};