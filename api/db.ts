import cloudbase from '@cloudbase/node-sdk'

const envId = process.env.CLOUDBASE_ENV_ID || 'goodnight-d3gg8l04nde6a3ec7'

const app = cloudbase.init({
  env: envId
})

const db = app.database()

export interface Submission {
  _id: string
  types: string
  text_content: string | null
  image_urls: string | null
  audio_url: string | null
  nickname: string | null
  status: string
  created_at: string
}

export async function getSubmissionById(id: string): Promise<Submission | null> {
  try {
    const result = await db.collection('submissions').doc(id).get()
    return result.data[0] as Submission || null
  } catch {
    return null
  }
}

export async function getRandomApprovedSubmission(): Promise<Submission | null> {
  try {
    const result = await db.collection('submissions')
      .where({ status: 'approved' })
      .orderBy('created_at', 'desc')
      .limit(20)
      .get()
    
    if (!result.data || result.data.length === 0) return null
    
    const randomIndex = Math.floor(Math.random() * result.data.length)
    return result.data[randomIndex] as Submission
  } catch {
    return null
  }
}

export async function createSubmission(data: {
  types: string
  text_content: string | null
  image_urls: string | null
  audio_url: string | null
  nickname: string | null
  status: string
}): Promise<string | null> {
  try {
    const result = await db.collection('submissions').add({
      types: data.types,
      text_content: data.text_content,
      image_urls: data.image_urls,
      audio_url: data.audio_url,
      nickname: data.nickname,
      status: data.status,
      created_at: new Date().toISOString()
    })
    return result.id || null
  } catch {
    return null
  }
}

export async function updateSubmissionStatus(id: string, status: string): Promise<boolean> {
  try {
    await db.collection('submissions').doc(id).update({ status })
    return true
  } catch {
    return false
  }
}

export async function deleteSubmission(id: string): Promise<boolean> {
  try {
    await db.collection('submissions').doc(id).remove()
    return true
  } catch {
    return false
  }
}

export interface GetSubmissionsResult {
  data: Submission[]
  total: number
  page: number
  limit: number
}

export async function getSubmissions(options: {
  type?: string
  status?: string
  search?: string
  page: number
  limit: number
}): Promise<GetSubmissionsResult> {
  const { type, status, search, page, limit } = options
  let query = db.collection('submissions')

  if (status) {
    query = query.where({ status })
  }

  const offset = (page - 1) * limit
  
  const result = await query
    .orderBy('created_at', 'desc')
    .skip(offset)
    .limit(limit)
    .get()

  const countResult = await query.count()

  return {
    data: result.data as Submission[],
    total: countResult.total || 0,
    page,
    limit
  }
}

export async function batchUpdateStatus(ids: string[], status: string): Promise<number> {
  let count = 0
  for (const id of ids) {
    try {
      await db.collection('submissions').doc(id).update({ status })
      count++
    } catch {}
  }
  return count
}

export async function batchDeleteSubmissions(ids: string[]): Promise<number> {
  let count = 0
  for (const id of ids) {
    try {
      await db.collection('submissions').doc(id).remove()
      count++
    } catch {}
  }
  return count
}

export interface SensitiveWord {
  _id: string
  word: string
  created_at: string
}

export async function getSensitiveWords(): Promise<SensitiveWord[]> {
  try {
    const result = await db.collection('sensitive_words')
      .orderBy('created_at', 'desc')
      .get()
    return result.data as SensitiveWord[]
  } catch {
    return []
  }
}

export async function addSensitiveWord(word: string): Promise<string | null> {
  try {
    const result = await db.collection('sensitive_words').add({
      word,
      created_at: new Date().toISOString()
    })
    return result.id || null
  } catch {
    return null
  }
}

export async function deleteSensitiveWord(id: string): Promise<boolean> {
  try {
    await db.collection('sensitive_words').doc(id).remove()
    return true
  } catch {
    return false
  }
}

export async function getAllSensitiveWords(): Promise<{ word: string }[]> {
  try {
    const result = await db.collection('sensitive_words').field({ word: true }).get()
    return result.data as { word: string }[]
  } catch {
    return []
  }
}

export interface AdminUser {
  _id: string
  username: string
  password_hash: string
}

export async function getAdminUser(username: string): Promise<AdminUser | undefined> {
  try {
    const result = await db.collection('admin_users')
      .where({ username })
      .get()
    return result.data[0] as AdminUser || undefined
  } catch {
    return undefined
  }
}

export interface StatsResult {
  total: number
  approved: number
  rejected: number
  pending: number
  byType: {
    text: number
    image: number
    audio: number
  }
}

export async function getStats(): Promise<StatsResult> {
  const [total, approved, rejected, pending] = await Promise.all([
    db.collection('submissions').count(),
    db.collection('submissions').where({ status: 'approved' }).count(),
    db.collection('submissions').where({ status: 'rejected' }).count(),
    db.collection('submissions').where({ status: 'pending' }).count()
  ])

  return {
    total: total.total || 0,
    approved: approved.total || 0,
    rejected: rejected.total || 0,
    pending: pending.total || 0,
    byType: {
      text: 0,
      image: 0,
      audio: 0
    }
  }
}

export async function initAdminUser() {
  const bcrypt = await import('bcryptjs')
  const existing = await getAdminUser('admin')
  
  if (!existing) {
    const passwordHash = bcrypt.hashSync('h2io2024', 10)
    await db.collection('admin_users').add({
      username: 'admin',
      password_hash: passwordHash
    })
  }
}

export async function initSensitiveWords() {
  const words = ['自杀', '死亡', '杀', '毒品', '赌博', '色情', '暴力', '反动', '政治', '上访', '抗议', '示威', '罢工', '邪教', '传销']
  
  for (const word of words) {
    const existing = await db.collection('sensitive_words').where({ word }).get()
    if (!existing.data || existing.data.length === 0) {
      await db.collection('sensitive_words').add({ word, created_at: new Date().toISOString() })
    }
  }
}
