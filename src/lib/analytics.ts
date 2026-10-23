type AnalyticsEvent = "view_item" | "search" | "add_to_cart" | "remove_from_cart" | "begin_checkout" | "order_request_created" | "contact_line";

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
let initialized = false;

function initializeAnalytics() {
  if (typeof window === "undefined" || !measurementId || initialized) return;
  initialized = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function (...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.onerror = () => { initialized = false; };
  document.head.appendChild(script);
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
}

export function trackEvent(event: AnalyticsEvent, properties: Record<string, string | number | boolean | undefined> = {}) {
  if (typeof window === "undefined" || !measurementId) return;
  initializeAnalytics();
  window.gtag?.("event", event, Object.fromEntries(Object.entries(properties).filter(([, value]) => value !== undefined)));
}

export function trackPageView(path = typeof window !== "undefined" ? window.location.pathname + window.location.search : "") {
  if (typeof window === "undefined" || !measurementId) return;
  initializeAnalytics();
  window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href });
}
