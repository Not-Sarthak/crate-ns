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

  const spinFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

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

  const handleSubmit = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' || !input.trim() || loading) return

    setSubmittedUrl(input)
    setSubmitted(true)
    setLoading(true)

    try {
      const scrapeResponse = await fetch(`${API_URL}/api/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
      })

      if (!scrapeResponse.ok) throw new Error('Failed to scrape')

      const scrapeData = await scrapeResponse.json()

      const generateResponse = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: scrapeData.pages }),
      })

      if (!generateResponse.ok) throw new Error('Failed to generate')

      const reader = generateResponse.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No reader available')

      let accumulatedTutorials: any[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6))

            if (data.type === 'tutorial') {
              accumulatedTutorials.push(data.data)
              setResults({
                tutorials: accumulatedTutorials,
                csv: '',
                totalTutorials: accumulatedTutorials.length,
              })
            } else if (data.type === 'complete') {
              setResults(data.data)
            } else if (data.type === 'error') {
              throw new Error(data.error)
            }
          }
        }
      }

      setLoading(false)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!results || !results.tutorials[0]) return
    navigator.clipboard.writeText(results.tutorials[0].content)
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
      setFollowUpInput('')
      setFollowUpLoading(false)
    } catch (err) {
      console.error(err)
      setFollowUpLoading(false)
    }
  }

  const downloadAll = () => {
    if (!results) return
    results.tutorials.forEach((tutorial: any) => {
      const blob = new Blob([tutorial.content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = tutorial.filename
      a.click()
      URL.revokeObjectURL(url)
    })
    const csvBlob = new Blob([results.csv], { type: 'text/csv' })
    const csvUrl = URL.createObjectURL(csvBlob)
    const csvLink = document.createElement('a')
    csvLink.href = csvUrl
    csvLink.download = 'tutorial-index.csv'
    csvLink.click()
    URL.revokeObjectURL(csvUrl)
  }

  return (
    <div className="terminal-grid-bg py-4 flex flex-col items-stretch">
      <BlockSpacer />
      <Intro />
      {!submitted && (
        <div className="flex text-sm px-4">
          <span className="text-black/40 mr-2">{`➜`}</span>
          <span className="text-black">~/docs</span>
          <span className="ml-2 text-black">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleSubmit}
            placeholder="https://docs.example.com"
            className="ml-2 bg-transparent outline-none text-black/60 placeholder:text-black/40 flex-1"
          />
        </div>
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
      {submitted && results && (
        <>
          <div className="mt-2 w-full rounded-md bg-[#f5e6d4] px-3 py-2 text-[12px] text-black/80">
            <div className="flex items-center text-black/40 mb-1 font-mono">
              <span className="flex-1">File</span>
              <span className="w-20 text-right">Cost</span>
              <span className="w-20 text-right">Actions</span>
            </div>
            {results.tutorials.map((tutorial: any, idx: number) => (
              <div key={idx} className="flex items-center text-black/60 hover:text-black py-0.5 font-mono">
                <span className="flex-1">llms/{tutorial.filename}</span>
                <span className="w-20 text-right">${tutorial.metadata.estimatedCost}</span>
                <span className="w-20 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tutorial.content)
                    }}
                    className="hover:text-black cursor-pointer"
                    title="Copy"
                  >
                    <Copy size={10} />
                  </button>
                  <button
                    onClick={() => {
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
          <CodeBlock>{results.tutorials[0]?.content || ''}</CodeBlock>
          <BlockSpacer />
        </>
      )}
      <BlockSpacer />
      <MarkdownTitle title="# Why crate?" />
      <Comment> - AI-powered tutorial generation from docs</Comment>
      <Comment> - Auto-generates structured markdown scaffolds</Comment>
      <Comment> - Includes cost estimates and difficulty levels</Comment>
      <Comment> - Export CSV index for easy tracking</Comment>
      <BlockSpacer />
      <MarkdownTitle title="# Perfect for" />
      <Comment> - Developer advocates building tutorial pipelines</Comment>
      <Comment> - Technical writers planning content</Comment>
      <Comment> - Open-source projects creating contributor tasks</Comment>
      <BlockSpacer />
      <div className="my-2 h-px bg-white/10" />
      <BlockSpacer />
    </div>
  )
}
