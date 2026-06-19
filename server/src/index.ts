import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import 'dotenv/config'
import { initRag, queryRag } from './rag/query.js'

const app = new Hono()

app.use('/api/*', cors())

let ready = false
initRag()
  .then(() => { ready = true; console.log('RAG ready') })
  .catch(err => { console.error('RAG init failed:', err) })

// Запрос к RAG: вопрос от пользователя → ответ по материалам курса
app.post('/api/query', async (c) => {
  if (!ready) return c.json({ error: 'RAG not ready' }, 503)
  const { question } = await c.req.json()
  if (!question || typeof question !== 'string') {
    return c.json({ error: 'question is required' }, 400)
  }
  const result = await queryRag(question)
  return c.json(result)
})

const port = Number(process.env.PORT || 3001)
// не стартуем HTTP-сервер во время тестов — Vitest выставляет NODE_ENV=test
if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port })
  console.log(`Server on http://localhost:${port}`)
}

// экспорт app для тестов: app.request() симулирует HTTP без реального сервера
export { app }
