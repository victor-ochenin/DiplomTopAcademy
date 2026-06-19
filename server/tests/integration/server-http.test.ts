import { vi, describe, it, expect, beforeAll } from 'vitest'

// мокаем serve() чтобы Hono-сервер не стартовал на реальном порту
vi.mock('@hono/node-server', () => ({ serve: vi.fn() }))

// мокаем query.ts: initRag сразу резолвится → ready = true
// queryRag — динамическая заглушка, зададим поведение в beforeAll
const mockQueryRag = vi.fn()

vi.mock('../../src/rag/query.js', () => ({
  initRag: vi.fn().mockResolvedValue(undefined),
  queryRag: mockQueryRag,
}))

let app: any // Hono-приложение, будет импортировано после установки моков

beforeAll(async () => {
  // динамический импорт — модуль загружается с уже подставленными моками
  const mod = await import('../../src/index.js')
  app = mod.app
  // queryRag возвращает предсказуемый ответ — без вызова OpenRouter
  mockQueryRag.mockResolvedValue({
    answer: 'useState — это хук для состояния',
    sources: ['useState Basics'],
  })
})

describe('POST /api/query', () => {
  // app.request() — Hono симулирует HTTP-запрос без реального сервера
  it('returns 200 with answer for valid request', async () => {
    const res = await app.request('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'Что такое useState?' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.answer).toBe('useState — это хук для состояния')
    expect(body.sources).toContain('useState Basics')
  })

  it('returns 400 for empty body', async () => {
    const res = await app.request('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('question is required')
  })

  it('returns 400 when question is not a string', async () => {
    const res = await app.request('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 123 }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('question is required')
  })
})
