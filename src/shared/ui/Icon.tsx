export default function Icon({ name }: { name: 'ok' | 'position' | 'explore' | 'layer' | 'book' | 'marker' }) {
  const paths = {
    ok: <path d="M5 12h14M12 5l7 7-7 7" />,
    position: <><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    explore: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>,
    layer: <path d="m12 3 10 6-10 6L2 9l10-6ZM2 14l10 6 10-6M2 18l10 6 10-6" />,
    book: <path d="M12 5v15M3 3c4 0 7 0 9 2 2-2 5-2 9-2v15c-4 0-7 0-9 2-2-2-5-2-9-2V3Z" />,
    marker: <path d="M5 20V9a7 7 0 0 1 14 0v11M9 20v-8a3 3 0 0 1 6 0v8M2 20h20" />,
  }
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}
