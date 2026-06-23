import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ensureIndex, ensureWebIndex, queryAll } from './vectorStore.js'

export async function initRag(): Promise<void> {
  await ensureIndex()
  await ensureWebIndex()
}

export async function queryRag(question: string): Promise<{ answer: string; sources: string[] }> {
  const docs = await queryAll(question)

  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0.3,
    configuration: { baseURL: 'https://openrouter.ai/api/v1' },
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are an assistant for a React course. Answer in your own words using the provided context. Do not copy the context text verbatim — paraphrase. If you include code examples, write your own, do not copy from the context. If the context does not contain the answer, say:
"В моей базе знаний не нашлось ответа на этот вопрос. Попробуйте самостоятельно поискать ответ."
Be brief.`],
    ['human', 'Context: {context}\n\nQuestion: {question}'],
  ])

  const answer = await prompt.pipe(model).pipe(new StringOutputParser()).invoke({
    context: docs.map(d => d.pageContent ?? '').join('\n\n'),
    question,
  })

  return { answer, sources: docs.map(d => d.metadata.title).filter(Boolean) }
}
