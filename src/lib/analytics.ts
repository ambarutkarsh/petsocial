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

/** Standard CTA event names used across the public SEO pages. */
export type CtaName =
  | 'join_petosauras'
  | 'find_vet_near_me'
  | 'open_digilocker'
  | 'calculate_budget'
  | 'join_community';

/** Book-a-Vet funnel events. */
export type BookVetEvent =
  | 'book_vet_opened'
  | 'vet_selected'
  | 'slot_selected'
  | 'vet_slot_selected'
  | 'vet_booking_submitted'
  | 'booking_submitted'
  | 'booking_success'
  | 'vet_booking_success'
  | 'booking_failed'
  | 'vet_booking_failed'
  | 'vet_accept_clicked'
  | 'vet_reject_clicked'
  | 'vet_reschedule_clicked'
  | 'vet_slots_generated'
  | 'vet_availability_updated'
  | 'vet_email_notification_sent'
  | 'vet_email_notification_failed'
  | 'vet_confirmed_from_email'
  | 'vet_rejected_from_email'
  | 'vet_confirmed_from_dashboard'
  | 'vet_rejected_from_dashboard'
  | 'vet_whatsapp_click_to_chat_clicked'
  | 'google_sheet_ledger_sync_success'
  | 'google_sheet_ledger_sync_failed';

export const trackBookVet = (event: BookVetEvent, params?: Record<string, any>) => {
  trackEvent(event, params);
};

export const trackCta = (cta: CtaName, params?: Record<string, any>) => {
  trackEvent('cta_click', { cta, ...params });
};
