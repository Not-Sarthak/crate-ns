import React from 'react'
import { TerminalBody } from '@/components/terminal-body'
import Link from 'next/link'

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="mx-auto max-w-[600px] px-4 pt-6 flex-1">
        <div className="flex items-center justify-between border-b border-black/10 px-4 py-2">
          <div className="text-xs text-black/60">{'📦'}</div>
          <Link
            href="https://x.com/0xSarthak13/"
            className="text-xs text-teal-300 hover:underline"
          >
            twitter
          </Link>
        </div>
        <TerminalBody />
        <footer className="mx-auto max-w-[600px] w-full px-6 py-2 text-xs text-black/40">
        <p>sarthak © {new Date().getFullYear()}</p>
      </footer>
      </div>
    </div>
  )
}
