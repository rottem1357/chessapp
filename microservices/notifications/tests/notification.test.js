const { sendNotification, sendWithBackoff } = require('../services/notificationService');

describe('notification service', () => {
  test('deduplicates notifications using idempotency key', async () => {
    const dispatchMock = jest.fn().mockResolvedValue(true);
    const payload = { idempotencyKey: 'abc', message: 'hi' };
    await sendNotification(payload, dispatchMock);
    await sendNotification(payload, dispatchMock);
    expect(dispatchMock).toHaveBeenCalledTimes(1);
  });

  test('retries with exponential backoff on failure', async () => {
    jest.useFakeTimers();
    const task = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('ok');

    const promise = sendWithBackoff(task, 2, 100);
    expect(task).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(100); // first retry
    expect(task).toHaveBeenCalledTimes(2);

    await promise;
    jest.useRealTimers();
  });
});
