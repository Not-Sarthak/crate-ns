import React from 'react'

export function Output({ children }: { children: React.ReactNode }) {
  return <div className="pl-6 text-sm text-black/70">{children}</div>
}
