// Single service-worker registration wrapper (PWA skill rules):
// registers /sw.js only in production, never in dev, previews, iframes, or ?sw=off.
// In any refused context it unregisters a stale /sw.js registration instead.

const PREVIEW_HOST_EXACT = ['lovableproject.com', 'lovableproject-dev.com', 'beta.lovable.dev'];

export type SwDecision = 'register' | 'refuse';

export function swRegistrationDecision(input: {
  prod: boolean;
  hostname: string;
  insideIframe: boolean;
  swParam: string | null;
}): SwDecision {
  if (!input.prod) return 'refuse';
  if (input.insideIframe) return 'refuse';
  if (input.swParam === 'off') return 'refuse';
  if (
    input.hostname.startsWith('id-preview--') ||
    input.hostname.startsWith('preview--') ||
    PREVIEW_HOST_EXACT.includes(input.hostname) ||
    PREVIEW_HOST_EXACT.some((host) => input.hostname.endsWith(`.${host}`))
  ) {
    return 'refuse';
  }
  return 'register';
}

async function unregisterAppSw(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((reg) => reg.active?.scriptURL.endsWith('/sw.js'))
        .map((reg) => reg.unregister()),
    );
  } catch {
    // best-effort cleanup only
  }
}

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const insideIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();
  const swParam = new URLSearchParams(window.location.search).get('sw');
  const decision = swRegistrationDecision({
    prod: import.meta.env.PROD,
    hostname: window.location.hostname,
    insideIframe,
    swParam,
  });
  if (decision === 'refuse') {
    void unregisterAppSw();
    return;
  }
  void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
    // registration failures must never break the app
  });
}
