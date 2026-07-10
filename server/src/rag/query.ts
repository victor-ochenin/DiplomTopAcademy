import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ensureIndex, ensureWebIndex, queryAll, LESSONS_DIR } from './vectorStore.js'


const model = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'nvidia/nemotron-3-super-120b-a12b:free',
  temperature: 0.3,
  configuration: { baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1' },
})

// Инициализация RAG: запускает индексацию документов курсов и веб-источников в ChromaDB.
// Вызывается однократно при старте сервера. Если чексумма не изменилась — пропускает переиндексацию.
export async function initRag(): Promise<void> {
  await ensureIndex()
  await ensureWebIndex()
}

// RAG-запрос: ищет релевантные документы по вопросу, формирует контекст и отправляет в LLM.
// history — опциональная переписка для поддержания контекста диалога.
// Возвращает ответ и список источников (id документов).
export async function queryRag(
  question: string,
  history?: { role: string; text: string }[]
): Promise<{ answer: string }> {
  const docs = await queryAll(question)

  const historyBlock = history?.length
    ? history.map(m => `${m.role}: ${m.text}`).join('\n') + '\n\n'
    : ''

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are an assistant for a React course. Answer in your own words using the provided context. Do not copy the context text verbatim — paraphrase. If you include code examples, write your own, do not copy from the context. If the context does not contain the answer, say:
"В моей базе знаний не нашлось ответа на этот вопрос. Попробуйте самостоятельно поискать ответ."
Be brief. Do not use concluding phrases like "Таким образом", "В итоге", "Итак" etc.`],
    ['human', '{history}Context: {context}\n\nQuestion: {question}'],
  ])

  const answer = await prompt.pipe(model).pipe(new StringOutputParser()).invoke({
    history: historyBlock,
    context: docs.map(d => d.pageContent ?? '').join('\n\n'),
    question,
  })

  return { answer }
}

// Проверяет код пользователя через LLM. Находит задачу по taskId в lesson.json,
// отправляет код + критерии в LLM, возвращает { passed, feedback }.
export async function checkCode(
  taskId: string,
  lessonId: string,
  code: string,
  kind?: string
): Promise<{ passed: boolean; feedback: string }> {
  const courses = readdirSync(LESSONS_DIR, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)
  let lessonPath = ''
  for (const course of courses) {
    const candidate = join(LESSONS_DIR, course, lessonId, 'lesson.json')
    if (existsSync(candidate)) { lessonPath = candidate; break }
  }
  if (!lessonPath) throw new Error(`Lesson ${lessonId} not found`)
  const lesson = JSON.parse(readFileSync(lessonPath, 'utf-8'))
  const task = lesson.tasks.find((t: any) => t.id === taskId)
  if (!task) throw new Error(`Task ${taskId} not found`)

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are a code reviewer. Check the provided code against the criteria.
Return JSON: {{ "passed": true/false, "feedback": "explanation in Russian" }}
Do NOT fix the code. Do NOT write a solution. Just evaluate.${kind === 'project' ? ' The code contains multiple project files separated by "--- filename ---" markers.' : ''}`],
    ['human', `Criteria:\n{criteria}\n\nCode:\n{code}`],
  ])

  let answer: string
  try {
    answer = await prompt.pipe(model).pipe(new StringOutputParser()).invoke({
      criteria: (task.criteria ?? []).join('\n'),
      code,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`LLM request failed: ${msg}`)
  }

  const cleaned = answer.replace(/```json|```/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return { passed: Boolean(parsed.passed), feedback: String(parsed.feedback ?? '') }
  } catch {
    return { passed: false, feedback: 'Не удалось обработать ответ проверки.' }
  }
}

export { LESSONS_DIR }
