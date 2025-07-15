// Sync Sequelize models with the database
const sequelize = require('../config/database');
const User = require('./User');
const Game = require('./game');
const Move = require('./Move');
const EngineReport = require('./EngineReport');
const Annotation = require('./Annotation');
const Opening = require('./Opening');
const Puzzle = require('./Puzzle'); // if using

const models = [User, Game, Move, EngineReport, Annotation, Opening, Puzzle];

async function syncModels() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    for (const model of models) {
      await model.sync({ alter: true });
      console.log(`${model.name} synced.`);
    }

    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
}

syncModels();
