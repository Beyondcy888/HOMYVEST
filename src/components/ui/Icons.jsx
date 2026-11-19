// Minimal monochrome line icons, one stroke weight. Only where they add meaning (docs/03 §8).
const base = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
  'aria-hidden': true,
  focusable: false,
};

export const ArrowRight = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
);
export const ArrowDown = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v15M6 13l6 6 6-6" />
  </svg>
);
export const ArrowUpRight = (p) => (
  <svg {...base} {...p}>
    <path d="M6 18 18 6M8 6h10v10" />
  </svg>
);
export const ArrowLeft = (p) => (
  <svg {...base} {...p}>
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
);
export const Close = (p) => (
  <svg {...base} {...p}>
    <path d="M5 5l14 14M19 5 5 19" />
  </svg>
);
export const Menu = (p) => (
  <svg {...base} {...p}>
    <path d="M3 8h18M3 16h18" />
  </svg>
);
export const Plus = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Warning = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3.5 22 20.5H2L12 3.5Z" />
    <path d="M12 10v5M12 17.6v.4" />
  </svg>
);
export const Check = (p) => (
  <svg {...base} {...p}>
    <path d="m4 12.5 5 5L20 6.5" />
  </svg>
);
export const Reset = (p) => (
  <svg {...base} {...p}>
    <path d="M4 12a8 8 0 1 0 2.6-5.9" />
    <path d="M4 4v5h5" />
  </svg>
);
export const Edit = (p) => (
  <svg {...base} {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
  </svg>
);
// A monochrome chat-bubble-with-handset glyph for WhatsApp buttons.
export const WhatsApp = (p) => (
  <svg {...base} strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M3.5 20.5 4.8 16A8.5 8.5 0 1 1 8 19.2l-4.5 1.3Z" />
    <path d="M9 8.6c-.5 1.2.1 3 1.6 4.6 1.6 1.6 3.4 2.200 4.700 1.700l.6-1.300-1.900-1.100-.8.800c-.8-.300-1.900-1.400-2.300-2.300l.8-.800L10.400 8 9 8.600Z" />
  </svg>
);
