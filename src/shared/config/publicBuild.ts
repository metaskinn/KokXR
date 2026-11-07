// The public build does not use archive photos whose permission is unconfirmed, nor files derived from them (AGENTS.md).
// The only exception is the Muradiye panel photo, published by the project owner's decision.
export const PUBLIC_BUILD = import.meta.env.VITE_PUBLIC_BUILD === '1'
