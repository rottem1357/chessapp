const express = require('express');
const morgan = require('morgan');
const logger = require('./utils/logger');

const puzzlesRoute = require('./routes/puzzles');
const puzzleRushRoute = require('./routes/puzzleRush');
const leaderboardRoute = require('./routes/leaderboards');

const app = express();
app.use(express.json());

app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

app.use('/puzzles', puzzlesRoute);
app.use('/puzzle-rush', puzzleRushRoute);
app.use('/leaderboards', leaderboardRoute);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    logger.info(`Puzzle service listening on port ${port}`);
  });
}

module.exports = app;
