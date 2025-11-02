import React from 'react'

export function CodeBlock({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-2 w-full block rounded-md bg-[#f5e6d4] text-[12px] leading-relaxed text-black/80">
      <code className="px-3 py-2 block w-full select-none">{children}</code>
    </pre>
  )
}
