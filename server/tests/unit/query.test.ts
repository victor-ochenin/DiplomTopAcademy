import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockFS = new Map<string, { isDirectory: boolean; content?: string }>()

function addFile(path: string, content: string) {
  mockFS.set(path.replace(/\\/g, '/'), { isDirectory: false, content })
}

function addDir(path: string) {
  mockFS.set(path.replace(/\\/g, '/'), { isDirectory: true })
}

// мокаем node:fs — factory НЕ ссылается на const из модуля (TDZ), всё внутри
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
  readdirSync: vi.fn((path: string) => {
    const p = path.replace(/\\/g, '/')
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

const mockRunnable = { pipe: vi.fn().mockReturnThis(), invoke: vi.fn() }

vi.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: { fromMessages: vi.fn().mockReturnValue(mockRunnable) },
}))

vi.mock('@langchain/openai', () => ({ ChatOpenAI: vi.fn().mockImplementation(function() { return {} }) }))
vi.mock('@langchain/core/output_parsers', () => ({ StringOutputParser: vi.fn().mockImplementation(function() { return {} }) }))

let mod: typeof import('../../src/rag/query.js')

beforeEach(async () => {
  mockFS.clear()
  mockRunnable.invoke.mockReset()
  mod = await import('../../src/rag/query.js')
})

function setupLesson(lessonId = 'what-is-react') {
  const dir = mod.LESSONS_DIR
  addDir(dir)
  addDir(dir + '/react-basics')
  addDir(dir + '/react-basics/' + lessonId)
  addFile(dir + '/react-basics/' + lessonId + '/lesson.json', JSON.stringify({
    id: lessonId,
    tasks: [{
      id: 'task1',
      type: 'coding',
      kind: 'file',
      question: 'Write a component',
      criteria: ['Uses JSX', 'Is a valid component'],
      expectedFiles: ['App.jsx'],
    }],
  }))
}

describe('checkCode', () => {
  it('returns { passed, feedback } for valid request', async () => {
    setupLesson('what-is-react')
    mockRunnable.invoke.mockResolvedValue('{"passed":true,"feedback":"good"}')
    const result = await mod.checkCode('task1', 'what-is-react', 'function App() {}')
    expect(result).toEqual({ passed: true, feedback: 'good' })
  })

  it('passes criteria and code to LLM', async () => {
    setupLesson('what-is-react')
    mockRunnable.invoke.mockResolvedValue('{"passed":true,"feedback":"ok"}')
    await mod.checkCode('task1', 'what-is-react', 'code', 'project')
    const args = mockRunnable.invoke.mock.calls[0][0]
    expect(args.criteria).toContain('Uses JSX')
    expect(args.code).toBe('code')
  })

  it('returns fallback for non-JSON LLM response', async () => {
    setupLesson('what-is-react')
    mockRunnable.invoke.mockResolvedValue('not json')
    const result = await mod.checkCode('task1', 'what-is-react', 'code')
    expect(result).toEqual({ passed: false, feedback: 'Не удалось обработать ответ проверки.' })
  })

  it('returns fallback when JSON fields are missing', async () => {
    setupLesson('what-is-react')
    mockRunnable.invoke.mockResolvedValue('{}')
    const result = await mod.checkCode('task1', 'what-is-react', 'code')
    expect(result).toEqual({ passed: false, feedback: '' })
  })

  it('throws when lesson is not found', async () => {
    addDir(mod.LESSONS_DIR)
    await expect(mod.checkCode('task1', 'nonexistent', 'code')).rejects.toThrow('Lesson nonexistent not found')
  })

  it('throws when task is not found', async () => {
    setupLesson('what-is-react')
    await expect(mod.checkCode('task99', 'what-is-react', 'code')).rejects.toThrow('Task task99 not found')
  })
})
