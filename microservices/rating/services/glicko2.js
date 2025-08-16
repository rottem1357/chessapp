// Basic Glicko-2 implementation for two-player updates
const q = Math.log(10) / 400;
const tau = 0.5;
const defaultRating = 1500;
const defaultRD = 350;
const defaultVol = 0.06;

function g(phi) {
  return 1 / Math.sqrt(1 + (3 * q * q * phi * phi) / (Math.PI * Math.PI));
}

function E(mu, muJ, phiJ) {
  return 1 / (1 + Math.exp(-g(phiJ) * (mu - muJ)));
}

function f(x, delta, phi, v, a) {
  const ex = Math.exp(x);
  const num = ex * (delta * delta - phi * phi - v - ex);
  const den = 2 * (phi * phi + v + ex) * (phi * phi + v + ex);
  return num / den - (x - a) / (tau * tau);
}

function updateRating(player, opponents) {
  const rating = player.rating;
  const rd = player.rd;
  const vol = player.vol;
  const mu = (rating - defaultRating) / 173.7178;
  const phi = rd / 173.7178;

  if (!opponents.length) {
    const phiPrime = Math.sqrt(phi * phi + vol * vol);
    return {
      rating,
      rd: phiPrime * 173.7178,
      vol
    };
  }

  let vDenom = 0;
  const temp = [];
  opponents.forEach((opp) => {
    const muJ = (opp.rating - defaultRating) / 173.7178;
    const phiJ = opp.rd / 173.7178;
    const gPhi = g(phiJ);
    const exp = E(mu, muJ, phiJ);
    vDenom += gPhi * gPhi * exp * (1 - exp);
    temp.push({ gPhi, exp, score: opp.score });
  });
  const v = 1 / vDenom;

  let deltaSum = 0;
  temp.forEach((t) => {
    deltaSum += t.gPhi * (t.score - t.exp);
  });
  const delta = v * deltaSum;

  const a = Math.log(vol * vol);
  let A = a;
  let B;
  if (delta * delta > phi * phi + v) {
    B = Math.log(delta * delta - phi * phi - v);
  } else {
    let k = 1;
    while (f(a - k * tau, delta, phi, v, a) < 0) {
      k++;
    }
    B = a - k * tau;
  }

  let fA = f(A, delta, phi, v, a);
  let fB = f(B, delta, phi, v, a);
  const EPSILON = 0.000001;
  while (Math.abs(B - A) > EPSILON) {
    const C = A + (A - B) * fA / (fB - fA);
    const fC = f(C, delta, phi, v, a);
    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }
    B = C;
    fB = fC;
  }
  const sigmaPrime = Math.exp(A / 2);
  const phiStar = Math.sqrt(phi * phi + sigmaPrime * sigmaPrime);
  const phiPrime = 1 / Math.sqrt(1 / (phiStar * phiStar) + 1 / v);
  let sum = 0;
  temp.forEach((t) => {
    sum += t.gPhi * (t.score - t.exp);
  });
  const muPrime = mu + phiPrime * phiPrime * sum;
  return {
    rating: muPrime * 173.7178 + defaultRating,
    rd: phiPrime * 173.7178,
    vol: sigmaPrime
  };
}

module.exports = {
  updateRating,
  defaultRating,
  defaultRD,
  defaultVol
};
