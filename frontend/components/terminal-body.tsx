'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Download } from 'lucide-react'
import { Intro } from './intro'
import { BlockSpacer } from './block-spacer'
import { Comment } from './comment'
import { MarkdownTitle } from './markdown-title'
import { CodeBlock } from './code-block'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export function TerminalBody() {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submittedUrl, setSubmittedUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [followUpInput, setFollowUpInput] = useState('')
  const [followUpLoading, setFollowUpLoading] = useState(false)
  const [loadingSpinIndex, setLoadingSpinIndex] = useState(0)
  const [followUpSpinIndex, setFollowUpSpinIndex] = useState(0)
  const [urlError, setUrlError] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [selectedTutorialIndex, setSelectedTutorialIndex] = useState(0)

  const spinFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch {
      return false
    }
  }

  useEffect(() => {
    if (!loading) return
    const spinId = setInterval(() => {
      setLoadingSpinIndex((i) => (i + 1) % spinFrames.length)
    }, 80)
    return () => clearInterval(spinId)
  }, [loading, spinFrames.length])

  useEffect(() => {
    if (!followUpLoading) return
    const spinId = setInterval(() => {
      setFollowUpSpinIndex((i) => (i + 1) % spinFrames.length)
    }, 80)
    return () => clearInterval(spinId)
  }, [followUpLoading, spinFrames.length])

  const submitUrl = async () => {
    if (!input.trim() || loading) return

    if (!isValidUrl(input.trim())) {
      setUrlError(true)
      setTimeout(() => setUrlError(false), 3000)
      return
    }

    setUrlError(false)
    setApiError(null)
    setSubmittedUrl(input)
    setSubmitted(true)
    setLoading(true)

    try {
      const scrapeResponse = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
      })

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to scrape documentation. Please check the URL and try again.')
      }

      const scrapeData = await scrapeResponse.json()

      const generateResponse = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: scrapeData.pages }),
      })

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to generate tutorials. Please try again.')
      }

      const data = await generateResponse.json()
      setResults(data)
      setSelectedTutorialIndex(0)
      setLoading(false)
    } catch (err) {
      console.error(err)
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setLoading(false)
      setSubmitted(false)
    }
  }

  const handleSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    await submitUrl()
  }

  const copyToClipboard = () => {
    if (!results || !results.tutorials[selectedTutorialIndex]) return
    navigator.clipboard.writeText(results.tutorials[selectedTutorialIndex].content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFollowUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !followUpInput.trim() || followUpLoading || !results) return

    setFollowUpLoading(true)

    try {
      const refineResponse = await fetch(`${API_URL}/api/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTutorials: results.tutorials,
          instruction: followUpInput,
        }),
      })

      if (!refineResponse.ok) throw new Error('Failed to refine')

      const refinedData = await refineResponse.json()
      setResults(refinedData)
      setSelectedTutorialIndex(0)
      setFollowUpInput('')
      setFollowUpLoading(false)
    } catch (err) {
      console.error(err)
      setFollowUpLoading(false)
    }
  }

  return (
    <div className="terminal-grid-bg py-4 flex flex-col items-stretch">
      <BlockSpacer />
      <BlockSpacer />
      <BlockSpacer />
      <Intro />
      {!submitted && (
        <>
          <div className="flex text-sm px-4 items-center gap-2">
            <div className='underline'>
            <span className="text-black/40 mr-2">{`➜`}</span>
            <span className="text-black">~/docs</span>
            <span className="ml-2 text-black">$</span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                if (apiError) setApiError(null)
              }}
              onKeyDown={handleSubmit}
              placeholder="https://docs.example.com"
              className="ml-2 underline bg-transparent outline-none text-black/60 placeholder:text-black/40 flex-1"
            />
            <button
              onClick={submitUrl}
              disabled={!input.trim() || loading}
              className="px-3 py-1 bg-black/80 hover:bg-black text-white/90 rounded text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ↵ Send
            </button>
          </div>
          <div className="text-xs px-4 mt-2">
            {urlError ? (
              <span className="text-red-600/80 ml-6">⚠ Please enter a valid URL (must start with http:// or https://)</span>
            ) : apiError ? (
              <span className="text-red-600/80 ml-6">⚠ {apiError}</span>
            ) : (
              <span className="text-black/40 italic">enter a documentation url here</span>
            )}
          </div>
        </>
      )}
      {submitted && loading && (
        <>
          <div className="flex text-sm px-4">
            <span className="text-black/40 mr-2">{`➜`}</span>
            <span className="text-black">~/docs</span>
            <span className="ml-2 text-black">$</span>
            <span className="ml-2 text-black/60">{submittedUrl}</span>
            <span className="ml-2 text-black/60">{spinFrames[loadingSpinIndex]}</span>
          </div>
        </>
      )}
      <BlockSpacer />
      <BlockSpacer />
      {submitted && results && (
        <>
          <div className="mt-2 w-full rounded-md bg-[#f5e6d4] px-3 py-2 text-[12px] text-black/80">
            <div className="flex items-center text-black/40 mb-1 font-mono">
              <span className="flex-1">File</span>
              <span className="w-20 text-right">Cost</span>
              <span className="w-20 text-right">Actions</span>
            </div>
            {results.tutorials.map((tutorial: any, idx: number) => (
              <div
                key={idx}
                className={`flex items-center py-0.5 font-mono cursor-pointer transition-colors ${
                  selectedTutorialIndex === idx
                    ? 'bg-black/10 text-black'
                    : 'text-black/60 hover:text-black hover:bg-black/5'
                }`}
                onClick={() => setSelectedTutorialIndex(idx)}
              >
                <span className="flex-1">llms/{tutorial.filename}</span>
                <span className="w-20 text-right">${tutorial.metadata.estimatedCost}</span>
                <span className="w-20 text-right flex gap-2 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(tutorial.content)
                    }}
                    className="hover:text-black cursor-pointer"
                    title="Copy"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const blob = new Blob([tutorial.content], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = tutorial.filename
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="hover:text-black cursor-pointer"
                    title="Download"
                  >
                    <Download size={10} />
                  </button>
                </span>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-black/10">
              <button
                onClick={() => {
                  const blob = new Blob([results.csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'tutorials-index.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-black/60 hover:text-black cursor-pointer flex items-center gap-2 text-xs font-mono"
              >
                <Download size={12} />
              </button>
            </div>
          </div>
          <BlockSpacer />
          <div className="flex text-sm px-4">
            <span className="text-black/40 mr-2">{`➜`}</span>
            <span className="text-black">~/refine</span>
            <span className="ml-2 text-black">$</span>
            <input
              type="text"
              value={followUpInput}
              onChange={(e) => setFollowUpInput(e.target.value)}
              onKeyDown={handleFollowUp}
              placeholder="make it more detailed, add examples, change focus..."
              disabled={followUpLoading}
              className="ml-2 bg-transparent outline-none text-black/60 placeholder:text-black/40 flex-1"
            />
            {followUpLoading && (
              <span className="ml-2 text-black/60">{spinFrames[followUpSpinIndex]}</span>
            )}
          </div>
          <BlockSpacer />
          <CodeBlock>{results.tutorials[selectedTutorialIndex]?.content || ''}</CodeBlock>
          <BlockSpacer />
        </>
      )}
      <BlockSpacer />
      <BlockSpacer />
      <BlockSpacer />
      <MarkdownTitle title="# Why crate?" />
      <Comment> - generate tutorials from docs</Comment>
      <Comment> - auto-generates structured markdown scaffolds</Comment>
      <Comment> - includes cost estimates and difficulty levels</Comment>
      <Comment> - exports CSV index for easy tracking</Comment>
      <BlockSpacer />
      <div className="my-2 h-px bg-white/10" />
      <BlockSpacer />
    </div>
  )
}
