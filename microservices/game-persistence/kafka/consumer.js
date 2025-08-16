// microservices/game-persistence/kafka/consumer.js
const { Kafka } = require('kafkajs');
const { handleMoveAppended, handleGameFinished } = require('../services/persistenceService');

async function start() {
  const kafka = new Kafka({
    clientId: 'game-persistence-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
  });
  const consumer = kafka.consumer({ groupId: 'game-persistence-service' });
  await consumer.connect();
  await consumer.subscribe({ topic: 'move.appended' });
  await consumer.subscribe({ topic: 'game.finished' });
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const event = JSON.parse(message.value.toString());
      if (topic === 'move.appended') {
        await handleMoveAppended(event);
      } else if (topic === 'game.finished') {
        await handleGameFinished(event);
      }
    }
  });
  return consumer;
}

module.exports = { start };
