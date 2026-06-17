import 'dotenv/config'
import { ChromaClient, OpenAIEmbeddingFunction } from 'chromadb'
import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const COLLECTION_NAME = 'nodomia'
const CHROMA_URL = 'http://localhost:8000'
const CHROMA_DATA_DIR = join(__dirname, '..', '..', 'data', 'chroma')
const LESSONS_DIR = join(__dirname, '..', '..', 'data', 'lessons')
const CHECKSUM_FILE = join(CHROMA_DATA_DIR, 'checksum.txt')

export interface DocumentResult {
  pageContent: string | null
  metadata: Record<string, string>
}

let queryCollection: ((text: string, k?: number) => Promise<DocumentResult[]>) | null = null

function computeChecksum(): string {
  const files: string[] = []

  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries.sort()) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name === 'lesson.json' || entry.name.endsWith('.md')) files.push(full)
    }
  }
  walk(LESSONS_DIR)

  const hash = createHash('sha256')
  for (const file of files) hash.update(readFileSync(file))
  return hash.digest('hex')
}

function loadDocuments(): { id: string; content: string; metadata: Record<string, string> }[] {
  const results: { id: string; content: string; metadata: Record<string, string> }[] = []

  if (!existsSync(LESSONS_DIR)) {
    console.warn(`Nodomia RAG: lessons dir not found at ${LESSONS_DIR}`)
    return results
  }

  function walkDir(dir: string) {
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch (err) {
      console.warn(`Nodomia RAG: cannot read directory ${dir}: ${err}`)
      return
    }

    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) { walkDir(full); continue }
      if (entry.name !== 'lesson.json') continue

      let raw: string
      try {
        raw = readFileSync(full, 'utf-8')
      } catch (err) {
        console.warn(`Nodomia RAG: cannot read ${full}: ${err}`)
        continue
      }

      let data: { id?: string; documents?: { id?: string; title?: string; contentFile?: string }[] }
      try {
        data = JSON.parse(raw)
      } catch (err) {
        console.warn(`Nodomia RAG: invalid JSON in ${full}: ${err}`)
        continue
      }

      const lessonId = data.id ?? 'unknown'
      const lessonDir = dirname(full)

      for (const doc of data.documents ?? []) {
        if (typeof doc?.contentFile !== 'string' || !doc.contentFile.endsWith('.md')) continue

        const mdPath = join(lessonDir, doc.contentFile)
        let mdContent: string
        try {
          mdContent = readFileSync(mdPath, 'utf-8')
        } catch {
          console.warn(`Nodomia RAG: .md not found for ${doc.id ?? '?'} in ${full}`)
          continue
        }

        results.push({
          id: `${lessonId}__${doc.id ?? '?'}`,
          content: mdContent,
          metadata: {
            source: mdPath,
            title: doc.title ?? '',
            lessonId,
          },
        })
      }
    }
  }

  walkDir(LESSONS_DIR)
  return results
}

// Создаёт или обновляет индекс ChromaDB через HTTP API (localhost:8000).
// При первом запуске или изменении чексуммы удаляет старую коллекцию,
// индексирует документы и сохраняет новую чексумму.
// Пробрасывает: ошибки ChromaDB.
export async function ensureIndex(): Promise<void> {
  mkdirSync(CHROMA_DATA_DIR, { recursive: true })

  const client = new ChromaClient({ path: CHROMA_URL })
  const embedder = new OpenAIEmbeddingFunction({
    openai_api_key: process.env.OPENAI_API_KEY!,
    openai_model: 'text-embedding-3-small',
  })

  const current = computeChecksum()
  let prev = ''
  try { prev = readFileSync(CHECKSUM_FILE, 'utf-8').trim() } catch { /* not exist */ }

  if (current !== prev) {
    try { await client.deleteCollection({ name: COLLECTION_NAME }) } catch { /* not exist */ }

    const collection = await client.createCollection({ name: COLLECTION_NAME, embeddingFunction: embedder })
    const docs = loadDocuments()

    if (docs.length === 0) {
      console.warn('Nodomia RAG: no documents to index, skipping')
      queryCollection = async () => []
      return
    }

    await collection.add({
      ids: docs.map(d => d.id),
      documents: docs.map(d => d.content),
      metadatas: docs.map(d => d.metadata),
    })

    writeFileSync(CHECKSUM_FILE, current)
    console.log(`Indexed ${docs.length} documents into ChromaDB`)
  }

  queryCollection = async (text: string, k = 3) => {
    const collection = await client.getCollection({ name: COLLECTION_NAME, embeddingFunction: embedder })
    const r = await collection.query({ queryTexts: [text], nResults: k })
    return (r.documents?.[0] ?? []).map((content, i) => ({
      pageContent: content,
      metadata: (r.metadatas?.[0]?.[i] ?? {}) as Record<string, string>,
    }))
  }
}

export function getQueryFn(): (text: string, k?: number) => Promise<DocumentResult[]> {
  if (!queryCollection) throw new Error('ChromaDB not initialized. Call ensureIndex() first.')
  return queryCollection
}
