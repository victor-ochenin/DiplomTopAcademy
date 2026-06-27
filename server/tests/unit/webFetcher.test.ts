import { vi, describe, it, expect, beforeEach } from 'vitest'

// --- loadWebSources (mock node:fs) ---
const mockFS = new Map<string, { isDirectory: boolean; content?: string }>()

function addFile(path: string, content: string) {
  mockFS.set(path.replace(/\\/g, '/'), { isDirectory: false, content })
}

function addDir(path: string) {
  mockFS.set(path.replace(/\\/g, '/'), { isDirectory: true })
}

vi.mock('node:fs', () => ({
  readFileSync: vi.fn((path: string) => {
    const p = path.replace(/\\/g, '/')
    const file = mockFS.get(p)
    if (!file || file.isDirectory) {
      const err = new Error(`ENOENT: ${p}`) as NodeJS.ErrnoException
      err.code = 'ENOENT'
      throw err
    }
    return file.content
  }),
  readdirSync: vi.fn((path: string, opts?: { withFileTypes?: boolean }) => {
    const p = path.replace(/\\/g, '/')
    const names: string[] = []
    for (const key of mockFS.keys()) {
      if (key.startsWith(p + '/')) {
        const rel = key.slice(p.length + 1)
        if (rel && !rel.includes('/')) names.push(rel)
      }
    }
    names.sort((a, b) => a.localeCompare(b))
    if (opts?.withFileTypes) {
      return names.map(name => ({
        name,
        isDirectory: () => mockFS.get(p + '/' + name)?.isDirectory ?? false,
      }))
    }
    return names
  }),
  existsSync: vi.fn((path: string) => {
    const p = path.replace(/\\/g, '/')
    for (const key of mockFS.keys()) {
      if (key === p || key.startsWith(p + '/')) return true
    }
    return false
  }),
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

let webFetcher: typeof import('../../src/rag/webFetcher.js')

beforeEach(() => {
  mockFS.clear()
})

// need dynamic import after mocks are set up
async function getMod() {
  if (!webFetcher) webFetcher = await import('../../src/rag/webFetcher.js')
  return webFetcher
}

// ---------- chunkPage (pure, no mocks) ----------
describe('chunkPage', () => {
  it('splits content by headings', async () => {
    const mod = await getMod()
    const page = { url: 'https://example.com', title: 'Test', headings: ['Intro', 'Details'],
      content: '# Intro\n\nHere is the introduction paragraph with enough text to exceed the minimum threshold of twenty characters.\n\n## Details\n\nMore detailed information that also exceeds the minimum twenty character threshold required.' }
    const chunks = mod.chunkPage(page, 'src1')
    expect(chunks).toHaveLength(2)
    expect(chunks[0].id).toBe('src1__0')
    expect(chunks[0].metadata.title).toBe('Intro')
    expect(chunks[0].content).toContain('# Intro')
    expect(chunks[1].id).toBe('src1__1')
    expect(chunks[1].metadata.title).toBe('Details')
  })

  it('filters chunks with body < 20 chars, fallback to single raw chunk', async () => {
    const mod = await getMod()
    const page = { url: 'https://example.com', title: 'Test', headings: [],
      content: '# Short\nhi\n\n## Also short\nbye\n\n### Another\nshort text only' }
    const chunks = mod.chunkPage(page, 'src1')
    expect(chunks).toHaveLength(1)
    expect(chunks[0].content).toBe(page.content)
  })

  it('falls back to single chunk when no headings found', async () => {
    const mod = await getMod()
    const page = { url: 'https://example.com', title: 'Fallback', headings: [],
      content: 'plain text without any markdown headings but longer than twenty chars' }
    const chunks = mod.chunkPage(page, 'src1')
    expect(chunks).toHaveLength(1)
    expect(chunks[0].id).toBe('src1__0')
    expect(chunks[0].metadata.title).toBe('Fallback')
    expect(chunks[0].metadata.heading).toBe('')
  })

  it('returns empty when page has no content', async () => {
    const mod = await getMod()
    const page = { url: 'https://example.com', title: 'Empty', headings: [], content: '' }
    const chunks = mod.chunkPage(page, 'src1')
    expect(chunks).toHaveLength(0)
  })
})

// ---------- loadWebSources (mock fs) ----------
describe('loadWebSources', () => {
  it('returns [] when dir does not exist', async () => {
    const mod = await getMod()
    expect(mod.loadWebSources('/nonexistent')).toEqual([])
  })

  it('parses valid JSON array files', async () => {
    const mod = await getMod()
    addDir('/sources')
    addFile('/sources/react.json', JSON.stringify([{ id: 'r1', url: 'https://react.dev', depth: 1 }]))
    addFile('/sources/js.json', JSON.stringify([{ id: 'j1', url: 'https://js.org', depth: 0 }]))
    const result = mod.loadWebSources('/sources')
    expect(result).toHaveLength(2)
    expect(result.find(s => s.id === 'r1')?.url).toBe('https://react.dev')
    expect(result.find(s => s.id === 'j1')?.depth).toBe(0)
  })

  it('skips non-JSON files', async () => {
    const mod = await getMod()
    addDir('/sources')
    addFile('/sources/notes.txt', 'ignore me')
    addFile('/sources/sources.json', JSON.stringify([{ id: 's1', url: 'https://example.com', depth: 0 }]))
    expect(mod.loadWebSources('/sources')).toHaveLength(1)
  })

  it('skips files with non-array JSON', async () => {
    const mod = await getMod()
    addDir('/sources')
    addFile('/sources/bad.json', '{"not": "array"}')
    expect(mod.loadWebSources('/sources')).toEqual([])
  })

  it('skips invalid JSON gracefully', async () => {
    const mod = await getMod()
    addDir('/sources')
    addFile('/sources/corrupt.json', 'not json at all')
    expect(mod.loadWebSources('/sources')).toEqual([])
  })
})

// ---------- fetchWebContent (mock globalThis.fetch) ----------
describe('fetchWebContent', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    globalThis.fetch = fetchMock
  })

  const mockHtmlResponse = (html: string, status = 200) =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(html),
    } as Response)

  it('returns null on non-ok status', async () => {
    fetchMock.mockResolvedValue(mockHtmlResponse('', 404))
    const mod = await getMod()
    const result = await mod.fetchWebContent('https://example.com')
    expect(result).toBeNull()
  })

  it('returns null on fetch error', async () => {
    fetchMock.mockRejectedValue(new Error('network error'))
    const mod = await getMod()
    const result = await mod.fetchWebContent('https://example.com')
    expect(result).toBeNull()
  })

  it('extracts title, headings and content from HTML', async () => {
    fetchMock.mockResolvedValue(mockHtmlResponse(`<!doctype html>
<html><head><title>React Docs</title></head>
<body><main>
<h1>Getting Started</h1>
<p>React is a library for building UIs.</p>
<h2>Installation</h2>
<p>Run npm create vite.</p>
</main></body></html>`))
    const mod = await getMod()
    const result = await mod.fetchWebContent('https://react.dev')
    expect(result).not.toBeNull()
    expect(result!.title).toBe('React Docs')
    expect(result!.headings).toEqual(['Getting Started', 'Installation'])
    expect(result!.content).toContain('Getting Started')
    expect(result!.content).toContain('React is a library')
    expect(result!.content).toContain('Installation')
  })

  it('uses <article> as fallback content selector', async () => {
    fetchMock.mockResolvedValue(mockHtmlResponse(`<html><body><article>
<h1>Article Title</h1>
<p>Article content here.</p>
</article></body></html>`))
    const mod = await getMod()
    const result = await mod.fetchWebContent('https://example.com')
    expect(result!.content).toContain('Article Title')
  })

  it('uses url as title when no <title> tag', async () => {
    fetchMock.mockResolvedValue(mockHtmlResponse('<html><body><p>no title</p></body></html>'))
    const mod = await getMod()
    const result = await mod.fetchWebContent('https://example.com/page')
    expect(result!.title).toBe('https://example.com/page')
  })

  it('removes script, nav, footer from content', async () => {
    fetchMock.mockResolvedValue(mockHtmlResponse(`<html><body><main>
<h1>Content</h1>
<p>Real text.</p>
<script>alert('xss')</script>
<nav>Menu</nav>
<footer>Footer</footer>
</main></body></html>`))
    const mod = await getMod()
    const result = await mod.fetchWebContent('https://example.com')
    expect(result!.content).toContain('Real text')
    expect(result!.content).not.toContain('alert')
    expect(result!.content).not.toContain('Menu')
    expect(result!.content).not.toContain('Footer')
  })
})
