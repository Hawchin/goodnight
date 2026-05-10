import { createClient } from '@supabase/supabase-js'
import ws from 'ws'
import bcrypt from 'bcryptjs'

const supabaseUrl = process.env.SUPABASE_URL || 'https://aktuauhkppmmqhjfuzrw.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFrdHVhdWhrcHBtbXFoamZ1enJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MTMzMTAsImV4cCI6MjA5Mzk4OTMxMH0.1N5uj9_eR4aQKZUy6fvEYXKbR2IPQZqwy1vzl-niNPY'

export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    transport: ws
  }
})

export interface Submission {
  id: number
  types: string
  text_content: string | null
  image_urls: string | null
  audio_url: string | null
  nickname: string | null
  status: string
  created_at: string
}

export async function getSubmissionById(id: number): Promise<Submission | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return null
  return data as Submission
}

export async function getRandomApprovedSubmission(): Promise<Submission | null> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error || !data || data.length === 0) return null
  
  const randomIndex = Math.floor(Math.random() * data.length)
  return data[randomIndex] as Submission
}

export async function createSubmission(data: {
  types: string
  text_content: string | null
  image_urls: string | null
  audio_url: string | null
  nickname: string | null
  status: string
}): Promise<number | null> {
  const { data: result, error } = await supabase
    .from('submissions')
    .insert({
      types: data.types,
      text_content: data.text_content,
      image_urls: data.image_urls,
      audio_url: data.audio_url,
      nickname: data.nickname,
      status: data.status
    })
    .select('id')
    .single()
  
  if (error) return null
  return result?.id || null
}

export async function updateSubmissionStatus(id: number, status: string): Promise<boolean> {
  const { error } = await supabase
    .from('submissions')
    .update({ status })
    .eq('id', id)
  
  return !error
}

export async function deleteSubmission(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', id)
  
  return !error
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
  let query = supabase.from('submissions').select('*', { count: 'exact' })

  if (type) {
    query = query.contains('types', `"${type}"`)
  }
  if (status) {
    query = query.eq('status', status)
  }
  if (search) {
    query = query.or(`text_content.ilike.%${search}%,nickname.ilike.%${search}%`)
  }

  const offset = (page - 1) * limit
  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  const { data, error, count } = await query

  return {
    data: (data || []) as Submission[],
    total: count || 0,
    page,
    limit
  }
}

export async function batchUpdateStatus(ids: number[], status: string): Promise<number> {
  let count = 0
  for (const id of ids) {
    const { error } = await supabase
      .from('submissions')
      .update({ status })
      .eq('id', id)
    
    if (!error) count++
  }
  return count
}

export async function batchDeleteSubmissions(ids: number[]): Promise<number> {
  let count = 0
  for (const id of ids) {
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id)
    
    if (!error) count++
  }
  return count
}

export interface SensitiveWord {
  id: number
  word: string
  created_at: string
}

export async function getSensitiveWords(): Promise<SensitiveWord[]> {
  const { data, error } = await supabase
    .from('sensitive_words')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return []
  return data as SensitiveWord[]
}

export async function addSensitiveWord(word: string): Promise<number | null> {
  const { data, error } = await supabase
    .from('sensitive_words')
    .insert({ word })
    .select('id')
    .single()
  
  if (error) return null
  return data?.id || null
}

export async function deleteSensitiveWord(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('sensitive_words')
    .delete()
    .eq('id', id)
  
  return !error
}

export async function getAllSensitiveWords(): Promise<{ word: string }[]> {
  const { data, error } = await supabase
    .from('sensitive_words')
    .select('word')
  
  if (error) return []
  return data as { word: string }[]
}

export interface AdminUser {
  id: number
  username: string
  password_hash: string
}

export async function getAdminUser(username: string): Promise<AdminUser | undefined> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('*')
    .eq('username', username)
    .single()
  
  if (error) return undefined
  return data as AdminUser
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
  const [totalRes, approvedRes, rejectedRes, pendingRes, textRes, imageRes, audioRes] = await Promise.all([
    supabase.from('submissions').select('id', { count: 'exact' }).limit(0),
    supabase.from('submissions').select('id', { count: 'exact' }).eq('status', 'approved').limit(0),
    supabase.from('submissions').select('id', { count: 'exact' }).eq('status', 'rejected').limit(0),
    supabase.from('submissions').select('id', { count: 'exact' }).eq('status', 'pending').limit(0),
    supabase.from('submissions').select('id', { count: 'exact' }).contains('types', '"text"').limit(0),
    supabase.from('submissions').select('id', { count: 'exact' }).contains('types', '"image"').limit(0),
    supabase.from('submissions').select('id', { count: 'exact' }).contains('types', '"audio"').limit(0)
  ])

  return {
    total: totalRes.count || 0,
    approved: approvedRes.count || 0,
    rejected: rejectedRes.count || 0,
    pending: pendingRes.count || 0,
    byType: {
      text: textRes.count || 0,
      image: imageRes.count || 0,
      audio: audioRes.count || 0
    }
  }
}
