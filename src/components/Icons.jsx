// Set de iconos SVG (stroke 1.75, 24x24) — reemplaza emojis para una UI consistente y profesional
const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }

export const IconTruck = (p) => (
  <svg {...base} {...p}>
    <path d="M3 7h11v9H3z" />
    <path d="M14 10h4l3 3v3h-7z" />
    <circle cx="7.5" cy="18" r="1.6" />
    <circle cx="17.5" cy="18" r="1.6" />
  </svg>
)

export const IconPackage = (p) => (
  <svg {...base} {...p}>
    <path d="M21 8l-9-5-9 5 9 5 9-5z" />
    <path d="M3 8v8l9 5 9-5V8" />
    <path d="M12 13v8" />
  </svg>
)

export const IconMapPin = (p) => (
  <svg {...base} {...p}>
    <path d="M12 21s-7-6.2-7-11a7 7 0 1114 0c0 4.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
)

export const IconUsers = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <circle cx="17.5" cy="8.5" r="2.6" />
    <path d="M15.5 14.2c2.7.5 4.5 2.6 4.5 5.8" />
  </svg>
)

export const IconLogOut = (p) => (
  <svg {...base} {...p}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
)

export const IconUpload = (p) => (
  <svg {...base} {...p}>
    <path d="M12 16V4" />
    <path d="M6.5 9.5L12 4l5.5 5.5" />
    <path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
  </svg>
)

export const IconCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

export const IconClock = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
)

export const IconAlert = (p) => (
  <svg {...base} {...p}>
    <path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
)

export const IconEye = (p) => (
  <svg {...base} {...p}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const IconRoute = (p) => (
  <svg {...base} {...p}>
    <circle cx="6" cy="19" r="2.2" />
    <circle cx="18" cy="5" r="2.2" />
    <path d="M6 16.8V13a4 4 0 014-4h4a4 4 0 004-4V7.2" />
  </svg>
)

export const IconRadio = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="2.2" />
    <path d="M8.5 8.5a5 5 0 000 7" />
    <path d="M15.5 8.5a5 5 0 010 7" />
    <path d="M5.2 5.2a9.5 9.5 0 000 13.6" />
    <path d="M18.8 5.2a9.5 9.5 0 010 13.6" />
  </svg>
)

export const IconChevronRight = (p) => (
  <svg {...base} {...p}>
    <path d="M9 6l6 6-6 6" />
  </svg>
)

export const IconX = (p) => (
  <svg {...base} {...p}>
    <path d="M18 6L6 18" />
    <path d="M6 6l12 12" />
  </svg>
)

export const IconWhatsapp = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width={20} height={20} {...p}>
    <path d="M12 2a10 10 0 00-8.6 15L2 22l5.2-1.4A10 10 0 1012 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3.1.8.8-3-.2-.3a8.2 8.2 0 1116.4-3.9c0 4.6-3.7 8.4-9.2 8.4zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1s-.7.8-.9 1c-.2.2-.3.2-.6.1a6.6 6.6 0 01-3.3-2.9c-.2-.4.2-.4.5-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.2.2-1 .9-1 2.3s1 2.6 1.1 2.8c.1.2 2 3 4.8 4.2.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.1-.2-.2-.5-.3z" />
  </svg>
)

export const IconAdmin = (p) => (
  <svg {...base} {...p}>
    <path d="M12 2l8 3.5v5c0 5-3.4 8.7-8 11-4.6-2.3-8-6-8-11v-5L12 2z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

export const IconExcel = (p) => (
  <svg {...base} {...p}>
    <path d="M4 4h11l5 5v11a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />
    <path d="M15 4v5h5" />
    <path d="M8.5 12.5l3 4M11.5 12.5l-3 4" />
  </svg>
)
