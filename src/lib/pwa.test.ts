import { describe, expect, it } from 'vitest';
import { swRegistrationDecision } from './pwa';

describe('swRegistrationDecision', () => {
  it('registers in production on a normal host', () => {
    expect(swRegistrationDecision({ prod: true, hostname: 'ibuzz.wtf', insideIframe: false, swParam: null })).toBe('register');
    expect(swRegistrationDecision({ prod: true, hostname: 'www.ibuzz.wtf', insideIframe: false, swParam: null })).toBe('register');
  });

  it('refuses outside production', () => {
    expect(swRegistrationDecision({ prod: false, hostname: 'ibuzz.wtf', insideIframe: false, swParam: null })).toBe('refuse');
  });

  it('refuses inside an iframe', () => {
    expect(swRegistrationDecision({ prod: true, hostname: 'ibuzz.wtf', insideIframe: true, swParam: null })).toBe('refuse');
  });

  it('refuses with ?sw=off', () => {
    expect(swRegistrationDecision({ prod: true, hostname: 'ibuzz.wtf', insideIframe: false, swParam: 'off' })).toBe('refuse');
  });

  it('refuses Lovable preview hosts and their subdomains', () => {
    expect(swRegistrationDecision({ prod: true, hostname: 'id-preview--87e5aaf2-a377-43e2-8150-f3b0d061c68b.lovable.app', insideIframe: false, swParam: null })).toBe('refuse');
    expect(swRegistrationDecision({ prod: true, hostname: 'ibuzz-wtf.lovable.app', insideIframe: false, swParam: null })).toBe('register');
    for (const hostname of ['id-preview--abc.lovableproject.com', 'preview--x.lovableproject.com', 'lovableproject.com', 'sub.lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev', 'sub.beta.lovable.dev']) {
      expect(swRegistrationDecision({ prod: true, hostname, insideIframe: false, swParam: null })).toBe('refuse');
    }
  });
});
