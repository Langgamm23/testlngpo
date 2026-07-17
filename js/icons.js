/* =========================================================================*
   AGORA — Icons Module
   SVG icon definitions for the application.
   ========================================================================= */

const Icons = {
  home: (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75">
      <path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>
    </svg>
  `,
  trending: (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75">
      <path d="M12 21a6 6 0 0 0 6-6c0-3-2-4.5-3-7 0 2-1.5 2.5-1.5 4.5C13.5 10 12 8.5 12 6c-2 2-4 5-4 9a4 4 0 0 0 4 4z"/>
    </svg>
  `,
  send: (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75">
      <path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>
    </svg>
  `,
  heart: (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  `,
  comment: (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  `,
  bookmark: (filled = false) => `
    <svg viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.75">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  `
};
