import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { ensureIndex, getQueryFn } from './vectorStore.js'

export async function initRag(): Promise<void> {
  await ensureIndex()
}

export async function queryRag(question: string): Promise<{ answer: string; sources: string[] }> {
  const docs = await getQueryFn()(question, 3)

  const model = new ChatOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    temperature: 0,
    configuration: { baseURL: 'https://openrouter.ai/api/v1' },
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', `You are an assistant for the Nodomia programming course.
Answer based on the provided context. Do not output the raw document text.
If the context does not contain the answer, say:
"В моей базе знаний не нашлось ответа на этот вопрос. Попробуйте самостоятельно поискать ответ."
Do not use any external knowledge.`],
    ['human', 'Context: {context}\n\nQuestion: {question}'],
  ])

  const answer = await prompt.pipe(model).pipe(new StringOutputParser()).invoke({
    context: docs.map(d => d.pageContent ?? '').join('\n\n'),
    question,
  })

  return { answer, sources: docs.map(d => d.metadata.title).filter(Boolean) }
}
