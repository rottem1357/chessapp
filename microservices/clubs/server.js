const express = require('express');
const logger = require('./middleware/logger');
const clubsRoutes = require('./routes/clubs');

const app = express();
app.use(express.json());
app.use(logger);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/clubs', clubsRoutes);

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Clubs service listening on port ${port}`);
  });
}

module.exports = app;
