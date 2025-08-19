// Side-effect only locale module for bootstrap-datepicker (no runtime export used)
declare module 'bootstrap-datepicker/dist/locales/bootstrap-datepicker.ko.min.js'

// Side-effect only plugin module declaration to satisfy TS module resolution
declare module 'bootstrap-datepicker'

// flatpickr 타입 보완 선언
declare module 'flatpickr' {
  export default function flatpickr(
    element: HTMLElement,
    options?: unknown
  ): { destroy: () => void };
}

declare module 'flatpickr/dist/l10n/ko.js' {
  export const Korean: unknown;
}