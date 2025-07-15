const db = require('../../models');
const { sampleUsers, sampleGames, samplePuzzles, sampleOpenings } = require('../fixtures/sampleData');

class TestDatabase {
  static async seed() {
    console.log('🌱 Seeding test database...');
    
    try {
      // Seed users
      const users = await db.User.bulkCreate(sampleUsers.map(user => ({
        ...user,
        password_hash: '$2b$10$dummy.hash.for.testing.purposes.only',
        id: require('uuid').v4()
      })));

      // Seed openings
      await db.Opening.bulkCreate(sampleOpenings);

      // Seed some games
      const games = await db.Game.bulkCreate(sampleGames.map(game => ({
        ...game,
        id: require('uuid').v4()
      })));

      // Seed puzzles
      await db.Puzzle.bulkCreate(samplePuzzles.map(puzzle => ({
        ...puzzle,
        id: require('uuid').v4()
      })));

      console.log('✅ Test database seeded successfully');
      return { users, games };
    } catch (error) {
      console.error('❌ Failed to seed test database:', error);
      throw error;
    }
  }

  static async clean() {
    const models = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize' && typeof db[key].destroy === 'function'
    );

    for (const modelName of models.reverse()) {
      await db[modelName].destroy({ where: {}, force: true });
    }
  }

  static async reset() {
    await this.clean();
    await this.seed();
  }
}

module.exports = TestDatabase;