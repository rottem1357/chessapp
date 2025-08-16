const deviceService = require('./deviceService');
const notificationModel = require('../models/notificationModel');

async function sendWithBackoff(task, retries = 3, delay = 100) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const execute = () => {
      task()
        .then(resolve)
        .catch((err) => {
          if (attempts < retries) {
            const wait = delay * Math.pow(2, attempts);
            attempts += 1;
            setTimeout(execute, wait);
          } else {
            reject(err);
          }
        });
    };
    execute();
  });
}

async function dispatch(message, channels, targets) {
  // Placeholder for SES/SNS, FCM/APNs integrations with topic fan-out.
  return { message, channels, targets };
}

async function sendNotification({ idempotencyKey, message, channels, userId }, dispatchFn = dispatch) {
  if (!idempotencyKey) throw new Error('idempotencyKey required');
  if (notificationModel.isSent(idempotencyKey)) {
    return { status: 'duplicate' };
  }
  notificationModel.markSent(idempotencyKey);
  const targets = userId ? deviceService.getDevices(userId) : [];
  await sendWithBackoff(() => dispatchFn(message, channels, targets));
  return { status: 'sent' };
}

module.exports = { sendNotification, sendWithBackoff };
