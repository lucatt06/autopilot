'use client'

import { useEffect } from 'react'

/** Automatically opens the print dialog once the page is fully rendered. */
export function PrintTrigger() {
  useEffect(() => {
    // Give the browser a tick to finish layout before opening print
    const t = setTimeout(() => window.print(), 400)
    return () => clearTimeout(t)
  }, [])

  return null
}
