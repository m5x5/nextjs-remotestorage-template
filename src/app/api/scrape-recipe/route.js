/**
 * POST /api/scrape-recipe
 * Fetches a recipe URL and returns the schema.org Recipe JSON-LD from the page.
 * Body: { url: string }
 */
import { NextResponse } from 'next/server'

function extractRecipeFromHtml(html) {
  const scriptRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const raw = match[1].trim()
      const data = JSON.parse(raw)
      if (data && typeof data === 'object') {
        if (data['@type'] === 'Recipe' || (Array.isArray(data['@type']) && data['@type'].includes('Recipe'))) {
          return data
        }
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item && (item['@type'] === 'Recipe' || (Array.isArray(item['@type']) && item['@type'].includes('Recipe')))) {
              return item
            }
          }
        }
      }
    } catch (_) {
      continue
    }
  }
  return null
}

export async function POST(request) {
  try {
    const body = await request.json()
    const url = body?.url?.trim()
    if (!url) {
      return NextResponse.json({ error: 'Missing url' }, { status: 400 })
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 502 })
    }

    const html = await res.text()
    const schema = extractRecipeFromHtml(html)
    if (!schema) {
      return NextResponse.json({ error: 'No Recipe schema.org JSON-LD found on page' }, { status: 404 })
    }

    return NextResponse.json({ schema })
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 504 })
    }
    console.error('scrape-recipe error:', err)
    return NextResponse.json({ error: err.message || 'Scrape failed' }, { status: 500 })
  }
}
