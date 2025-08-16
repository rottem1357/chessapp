const express = require('express');
const ratingRoutes = require('./routes/ratings');
const requestLogger = require('./logger/requestLogger');

const app = express();
app.use(express.json());
app.use(requestLogger);

app.use('/ratings', ratingRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Rating service listening on port ${port}`);
  });
}

module.exports = app;
