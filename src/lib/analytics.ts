declare global {
  interface Window { gtag: (...args: any[]) => void; dataLayer: any[]; }
}

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', eventName, params);
  }
};

export const trackPageView = (pagePath: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', 'G-9KE1HT989P', { page_path: pagePath });
  }
};
