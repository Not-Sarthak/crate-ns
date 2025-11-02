import React from 'react'

export function Comment({ children }: { children: React.ReactNode }) {
  return <div className="pl-2 text-sm text-black/80">{children}</div>
}
