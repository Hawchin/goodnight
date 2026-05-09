import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const uploadsImagesDir = path.join(__dirname, '..', 'uploads', 'images')
const uploadsAudioDir = path.join(__dirname, '..', 'uploads', 'audio')
if (!fs.existsSync(uploadsImagesDir)) {
  fs.mkdirSync(uploadsImagesDir, { recursive: true })
}
if (!fs.existsSync(uploadsAudioDir)) {
  fs.mkdirSync(uploadsAudioDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'goodnight.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    types TEXT NOT NULL,
    text_content TEXT,
    image_urls TEXT,
    audio_url TEXT,
    nickname TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
  CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);

  CREATE TABLE IF NOT EXISTS sensitive_words (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    word TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL
  );
`)

const existingAdmin = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin')
if (!existingAdmin) {
  const passwordHash = bcrypt.hashSync('goodnight2026', 10)
  db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash)
}

const existingWords = db.prepare('SELECT COUNT(*) as count FROM sensitive_words').get() as { count: number }
if (existingWords.count === 0) {
  const initialWords = ['自杀', '死亡', '杀', '毒品', '赌博', '色情', '暴力', '反动', '政治', '上访', '抗议', '示威', '罢工', '邪教', '传销']
  const insertWord = db.prepare('INSERT OR IGNORE INTO sensitive_words (word) VALUES (?)')
  const insertMany = db.transaction((words: string[]) => {
    for (const word of words) {
      insertWord.run(word)
    }
  })
  insertMany(initialWords)
}

export function getSubmissionById(id: number) {
  return db.prepare('SELECT * FROM submissions WHERE id = ?').get(id)
}

export function getRandomApprovedSubmission() {
  return db.prepare("SELECT * FROM submissions WHERE status = 'approved' ORDER BY RANDOM() LIMIT 1").get()
}

export function createSubmission(data: {
  types: string
  text_content: string | null
  image_urls: string | null
  audio_url: string | null
  nickname: string | null
  status: string
}) {
  const stmt = db.prepare(
    'INSERT INTO submissions (types, text_content, image_urls, audio_url, nickname, status) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const result = stmt.run(data.types, data.text_content, data.image_urls, data.audio_url, data.nickname, data.status)
  return result.lastInsertRowid
}

export function updateSubmissionStatus(id: number, status: string) {
  return db.prepare('UPDATE submissions SET status = ? WHERE id = ?').run(status, id)
}

export function deleteSubmission(id: number) {
  return db.prepare('DELETE FROM submissions WHERE id = ?').run(id)
}

export function getSubmissions(options: {
  type?: string
  status?: string
  search?: string
  page: number
  limit: number
}) {
  const { type, status, search, page, limit } = options
  const conditions: string[] = []
  const params: any[] = []

  if (type) {
    conditions.push("types LIKE ?")
    params.push(`%"${type}"%`)
  }
  if (status) {
    conditions.push('status = ?')
    params.push(status)
  }
  if (search) {
    conditions.push('(text_content LIKE ? OR nickname LIKE ?)')
    params.push(`%${search}%`, `%${search}%`)
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''
  const offset = (page - 1) * limit

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM submissions ${whereClause}`).get(...params) as { total: number }
  const rows = db.prepare(`SELECT * FROM submissions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, limit, offset)

  return {
    data: rows,
    total: countRow.total,
    page,
    limit
  }
}

export function batchUpdateStatus(ids: number[], status: string) {
  const stmt = db.prepare('UPDATE submissions SET status = ? WHERE id = ?')
  const updateMany = db.transaction((ids: number[], status: string) => {
    let count = 0
    for (const id of ids) {
      const result = stmt.run(status, id)
      if (result.changes > 0) count++
    }
    return count
  })
  return updateMany(ids, status)
}

export function batchDeleteSubmissions(ids: number[]) {
  const stmt = db.prepare('DELETE FROM submissions WHERE id = ?')
  const deleteMany = db.transaction((ids: number[]) => {
    let count = 0
    for (const id of ids) {
      const result = stmt.run(id)
      if (result.changes > 0) count++
    }
    return count
  })
  return deleteMany(ids)
}

export function getSensitiveWords() {
  return db.prepare('SELECT * FROM sensitive_words ORDER BY created_at DESC').all()
}

export function addSensitiveWord(word: string) {
  const stmt = db.prepare('INSERT INTO sensitive_words (word) VALUES (?)')
  const result = stmt.run(word)
  return result.lastInsertRowid
}

export function deleteSensitiveWord(id: number) {
  return db.prepare('DELETE FROM sensitive_words WHERE id = ?').run(id)
}

export function getAllSensitiveWords() {
  return db.prepare('SELECT word FROM sensitive_words').all() as { word: string }[]
}

export function getAdminUser(username: string) {
  return db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username) as {
    id: number
    username: string
    password_hash: string
  } | undefined
}

export function getStats() {
  const total = (db.prepare('SELECT COUNT(*) as count FROM submissions').get() as { count: number }).count
  const approved = (db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'approved'").get() as { count: number }).count
  const rejected = (db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'rejected'").get() as { count: number }).count
  const pending = (db.prepare("SELECT COUNT(*) as count FROM submissions WHERE status = 'pending'").get() as { count: number }).count
  const textCount = (db.prepare("SELECT COUNT(*) as count FROM submissions WHERE types LIKE '%text%'").get() as { count: number }).count
  const imageCount = (db.prepare("SELECT COUNT(*) as count FROM submissions WHERE types LIKE '%image%'").get() as { count: number }).count
  const audioCount = (db.prepare("SELECT COUNT(*) as count FROM submissions WHERE types LIKE '%audio%'").get() as { count: number }).count

  return {
    total,
    approved,
    rejected,
    pending,
    byType: {
      text: textCount,
      image: imageCount,
      audio: audioCount
    }
  }
}

export default db
