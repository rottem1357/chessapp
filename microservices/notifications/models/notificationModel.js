const sent = new Set();

function isSent(key) {
  return sent.has(key);
}

function markSent(key) {
  sent.add(key);
}

module.exports = { isSent, markSent };
