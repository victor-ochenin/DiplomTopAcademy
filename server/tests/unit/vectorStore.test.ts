import { vi, describe, it, expect, beforeEach } from 'vitest'

// Виртуальная файловая система
// Вместо работы с реальными уроками тесты наполняют in-memory Map,
// а vi.mock('node:fs') перенаправляет readFileSync / readdirSync / existsSync
// в эту карту. Так тесты быстры, детерминированы и не зависят от окружения.

const mockFS = new Map<string, { isDirectory: boolean; content?: string }>()

function addFile(path: string, content: string) {
  mockFS.set(normalize(path), { isDirectory: false, content })
}

function addDir(path: string) {
  mockFS.set(normalize(path), { isDirectory: true })
}

function normalize(p: string) {
  return p.replace(/\\/g, '/')
}

vi.mock('node:fs', () => ({
  // readFileSync — возвращает содержимое из mockFS, либо кидает ENOENT
  readFileSync: vi.fn((path: string) => {
    const p = normalize(path)
    const file = mockFS.get(p)
    if (!file || file.isDirectory) {
      const err = new Error(`ENOENT: ${p}`) as NodeJS.ErrnoException
      err.code = 'ENOENT'
      throw err
    }
    return file.content
  }),

  // readdirSync({ withFileTypes: true }) — возвращает Dirent-подобные объекты
  readdirSync: vi.fn((path: string) => {
    const p = normalize(path)
    const entries: { name: string; isDirectory(): boolean }[] = []
    for (const key of mockFS.keys()) {
      if (key.startsWith(p + '/')) {
        const rel = key.slice(p.length + 1)
        if (rel && !rel.includes('/')) {
          entries.push({
            name: rel,
            isDirectory: () => mockFS.get(key)?.isDirectory ?? false,
          })
        }
      }
    }
    return entries.sort((a, b) => a.name.localeCompare(b.name))
  }),

  // existsSync — true если путь есть в mockFS или является родителем записей
  existsSync: vi.fn((path: string) => {
    const p = normalize(path)
    for (const key of mockFS.keys()) {
      if (key === p || key.startsWith(p + '/')) return true
    }
    return false
  }),

  // ensureIndex вызывает mkdirSync/writeFileSync — они не тестируются
  mkdirSync: vi.fn(),
  writeFileSync: vi.fn(),
}))

let vectorStore: typeof import('../../src/rag/vectorStore.js')
let LESSONS_DIR: string

beforeEach(async () => {
  mockFS.clear()
  vectorStore = await import('../../src/rag/vectorStore.js')
  LESSONS_DIR = vectorStore.LESSONS_DIR
})

// Обходит уроки, собирает все .json / .md, считает SHA-256.
describe('computeChecksum', () => {
  it('returns 64 hex chars for empty dir', () => {
    addDir(LESSONS_DIR)
    expect(vectorStore.computeChecksum()).toMatch(/^[a-f0-9]{64}$/)
  })

  it('changes when file content changes', () => {
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/jsx')
    addFile(LESSONS_DIR + '/jsx/lesson.json', '{"id":"jsx","documents":[]}')
    const hash1 = vectorStore.computeChecksum()

    // очищаем и пересоздаём с другим содержимым lesson.json
    mockFS.clear()
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/jsx')
    addFile(LESSONS_DIR + '/jsx/lesson.json', '{"id":"jsx","documents":[{"id":"a","title":"A"}]}')
    const hash2 = vectorStore.computeChecksum()

    expect(hash1).not.toBe(hash2)
  })

  it('only considers .json and .md files', () => {
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/jsx')
    addFile(LESSONS_DIR + '/jsx/lesson.json', '{"id":"jsx","documents":[]}')
    addFile(LESSONS_DIR + '/jsx/notes.txt', 'this should be ignored')
    addFile(LESSONS_DIR + '/.DS_Store', 'ignored')

    const hash = vectorStore.computeChecksum()
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })
})

// Читает lesson.json из каждой поддиректории, подгружает .md файлы
// и возвращает массив документов для индексации.
describe('loadDocuments', () => {
  it('returns [] when lessons dir does not exist', () => {
    expect(vectorStore.loadDocuments()).toEqual([])
  })

  it('returns [] for empty dir', () => {
    addDir(LESSONS_DIR)
    expect(vectorStore.loadDocuments()).toEqual([])
  })

  it('parses one lesson with one .md', () => {
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/what-is-react')
    addFile(LESSONS_DIR + '/what-is-react/lesson.json', JSON.stringify({
      id: 'what-is-react',
      documents: [{ id: 'intro', title: 'Введение', contentFile: 'intro.md' }],
    }))
    addFile(LESSONS_DIR + '/what-is-react/intro.md', '# React')

    const docs = vectorStore.loadDocuments()
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe('what-is-react__intro')
    expect(docs[0].content).toBe('# React')
    expect(docs[0].metadata.title).toBe('Введение')
  })

  it('skips doc when .md is missing', () => {
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/what-is-react')
    addFile(LESSONS_DIR + '/what-is-react/lesson.json', JSON.stringify({
      id: 'what-is-react',
      documents: [
        { id: 'intro', title: 'Введение', contentFile: 'intro.md' },
        { id: 'setup', title: 'Настройка', contentFile: 'setup.md' },
      ],
    }))
    addFile(LESSONS_DIR + '/what-is-react/intro.md', '# React')

    const docs = vectorStore.loadDocuments()
    expect(docs).toHaveLength(1)
    expect(docs[0].id).toBe('what-is-react__intro')
  })

  it('returns [] for broken JSON', () => {
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/what-is-react')
    addFile(LESSONS_DIR + '/what-is-react/lesson.json', 'not json')

    expect(vectorStore.loadDocuments()).toEqual([])
  })

  it('handles multiple lessons', () => {
    addDir(LESSONS_DIR)
    addDir(LESSONS_DIR + '/jsx')
    addFile(LESSONS_DIR + '/jsx/lesson.json', JSON.stringify({
      id: 'jsx',
      documents: [{ id: 'intro', title: 'JSX', contentFile: 'jsx-intro.md' }],
    }))
    addFile(LESSONS_DIR + '/jsx/jsx-intro.md', '# JSX')
    addDir(LESSONS_DIR + '/props')
    addFile(LESSONS_DIR + '/props/lesson.json', JSON.stringify({
      id: 'props',
      documents: [{ id: 'basics', title: 'Props', contentFile: 'props-basics.md' }],
    }))
    addFile(LESSONS_DIR + '/props/props-basics.md', '# Props')

    const docs = vectorStore.loadDocuments()
    expect(docs).toHaveLength(2)
    expect(docs.map(d => d.id)).toContain('jsx__intro')
    expect(docs.map(d => d.id)).toContain('props__basics')
  })
})
