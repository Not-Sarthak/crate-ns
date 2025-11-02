import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export const maxDuration = 10
export const runtime = 'nodejs'

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate URL
    let baseUrl: URL
    try {
      baseUrl = new URL(url)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const visitedUrls = new Set<string>()
    const pages: Array<{ url: string; title: string; content: string }> = []
    const urlsToVisit = [url]
    const maxPages = 15 // Reduced for free tier timeout limits

    while (urlsToVisit.length > 0 && pages.length < maxPages) {
      const currentUrl = urlsToVisit.shift()!

      if (visitedUrls.has(currentUrl)) continue
      visitedUrls.add(currentUrl)

      try {
        const response = await fetch(currentUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TutorialBot/1.0)',
          },
        })

        if (!response.ok) continue

        const html = await response.text()
        const $ = cheerio.load(html)

        // Remove script, style, and navigation elements
        $('script, style, nav, header, footer, .navigation, .sidebar').remove()

        // Extract main content
        const title = $('h1').first().text() || $('title').text() || 'Untitled'
        const content = $('main, article, .content, .documentation, body')
          .first()
          .text()
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 10000) // Limit content length

        if (content.length > 100) {
          pages.push({
            url: currentUrl,
            title: title.trim(),
            content: content,
          })
        }

        // Find more documentation links
        $('a[href]').each((_, element) => {
          const href = $(element).attr('href')
          if (!href) return

          try {
            const linkUrl = new URL(href, currentUrl)

            // Only follow links on the same domain
            if (
              linkUrl.hostname === baseUrl.hostname &&
              !visitedUrls.has(linkUrl.href) &&
              !urlsToVisit.includes(linkUrl.href) &&
              urlsToVisit.length + pages.length < maxPages
            ) {
              urlsToVisit.push(linkUrl.href)
            }
          } catch {
            // Invalid URL, skip
          }
        })
      } catch (error) {
        console.error(`Error scraping ${currentUrl}:`, error)
        continue
      }
    }

    return NextResponse.json(
      {
        pages,
        totalPages: pages.length,
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Scraping error:', error)
    return NextResponse.json(
      { error: 'Failed to scrape documentation' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
