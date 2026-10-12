import { describe, it, expect } from 'vitest';
import { cooldownDecision, createChallenge, verifyChallenge } from './form-guard';

const now = 1_800_000_000_000;
describe('form guard', () => {
  it('blocks a second submission within 60 seconds', () => expect(cooldownDecision([now - 59_000], now)).toBe('cooldown'));
  it('allows a submission after 60 seconds', () => expect(cooldownDecision([now - 61_000], now)).toBe('ok'));
  it('blocks the 6th submission within an hour', () => expect(cooldownDecision([1, 2, 3, 4, 5].map(i => now - i * 600_000), now)).toBe('cooldown'));
  it('accepts the correct answer and rejects a wrong one', async () => {
    const c = await createChallenge('s', now);
    const [a = 0, b = 0] = c.question.split(' + ').map(Number);
    expect(await verifyChallenge('s', c.token, String(a + b), now + 5000)).toBe(true);
    expect(await verifyChallenge('s', c.token, String(a + b + 1), now + 5000)).toBe(false);
  });
  it('rejects answers sent faster than 3 seconds', async () => {
    const c = await createChallenge('s', now);
    const [a = 0, b = 0] = c.question.split(' + ').map(Number);
    expect(await verifyChallenge('s', c.token, String(a + b), now + 1000)).toBe(false);
  });
});
