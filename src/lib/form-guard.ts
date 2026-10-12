// Anti-spam helpers for public enquiry forms (server-side use; pure, testable).
export const COOLDOWN_SECONDS = 60;
export const HOURLY_LIMIT = 5;
export const MIN_FILL_SECONDS = 3;
export const CHALLENGE_TTL_SECONDS = 30 * 60;

const enc = new TextEncoder();
async function hmac(secret: string, msg: string) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(msg)));
  return Array.from(sig, b => b.toString(16).padStart(2, '0')).join('');
}

/** easy=true gives very simple sums: 1-3 plus 1 (answers 2-4). */
export async function createChallenge(secret: string, now = Date.now(), easy = false) {
  const a = 1 + Math.floor(Math.random() * (easy ? 3 : 9)), b = easy ? 1 : 1 + Math.floor(Math.random() * 9);
  const issued = Math.floor(now / 1000);
  const sig = await hmac(secret, `${a + b}.${issued}`);
  return { question: `${a} + ${b}`, token: `${issued}.${sig}` };
}

/** Non-math alternative: visitor ticks a confirmation box. Still time-gated, signed, and rate-limited. */
export const CONFIRM_ANSWER = 'confirm';
export async function createConfirmChallenge(secret: string, now = Date.now()) {
  const issued = Math.floor(now / 1000);
  return { token: `c.${issued}.${await hmac(secret, `confirm.${issued}`)}` };
}

export async function verifyChallenge(secret: string, token: string, answer: string, now = Date.now()) {
  if (token.startsWith('c.')) {
    const [, issuedRaw, sig] = token.split('.');
    const issued = Number(issuedRaw), age = Math.floor(now / 1000) - issued;
    if (!Number.isFinite(issued) || !sig || age < MIN_FILL_SECONDS || age > CHALLENGE_TTL_SECONDS || answer !== CONFIRM_ANSWER) return false;
    return (await hmac(secret, `confirm.${issued}`)) === sig;
  }
  const [issuedRaw, sig] = token.split('.');
  const issued = Number(issuedRaw), age = Math.floor(now / 1000) - issued;
  if (!Number.isFinite(issued) || !sig || age < MIN_FILL_SECONDS || age > CHALLENGE_TTL_SECONDS) return false;
  const n = Number(answer.trim());
  if (!Number.isInteger(n)) return false;
  return (await hmac(secret, `${n}.${issued}`)) === sig;
}

/** Returns 'ok' or 'cooldown' given the visitor's recent submission times (ms). */
export function cooldownDecision(recent: number[], now = Date.now()) {
  if (recent.some(t => now - t < COOLDOWN_SECONDS * 1000)) return 'cooldown';
  if (recent.filter(t => now - t < 3600_000).length >= HOURLY_LIMIT) return 'cooldown';
  return 'ok';
}

export async function hashVisitor(secret: string, ip: string) {
  return hmac(secret, `visitor:${ip}`);
}
