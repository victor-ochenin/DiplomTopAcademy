import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import 'dotenv/config'
import { initRag, queryRag, checkCode } from './rag/query.js'

const app = new Hono()

app.use('/api/*', cors())

let ready = false
initRag()
  .then(() => { ready = true; console.log('RAG ready') })
  .catch(err => { console.error('RAG init failed:', err) })

// Запрос к RAG: вопрос от пользователя → ответ по материалам курса
app.post('/api/query', async (c) => {
  if (!ready) return c.json({ error: 'RAG not ready' }, 503)
  const { question, history } = await c.req.json()
  if (!question || typeof question !== 'string') {
    return c.json({ error: 'question is required' }, 400)
  }
  const result = await queryRag(question, history)
  return c.json(result)
})

// Проверка кода пользователя через LLM. Читает lesson.json, находит задачу по taskId,
// отправляет код + критерии в LLM, возвращает { passed, feedback }.
app.post('/api/check-code', async (c) => {
  const { taskId, lessonId, code } = await c.req.json().catch(() => ({}))
  if (typeof taskId !== 'string' || typeof lessonId !== 'string' || typeof code !== 'string') {
    return c.json({ error: 'taskId, lessonId and code are required' }, 400)
  }
  try {
    const result = await checkCode(taskId, lessonId, code)
    return c.json(result)
  } catch (err) {
    console.error('check-code failed', err)
    return c.json({ error: 'Failed to check code' }, 500)
  }
})

const port = Number(process.env.PORT || 3001)
// не стартуем HTTP-сервер во время тестов — Vitest выставляет NODE_ENV=test
if (process.env.NODE_ENV !== 'test') {
  serve({ fetch: app.fetch, port })
  console.log(`Server on http://localhost:${port}`)
}

// экспорт app для тестов: app.request() симулирует HTTP без реального сервера
export { app }
