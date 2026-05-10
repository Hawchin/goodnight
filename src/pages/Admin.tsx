import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/stores/adminStore'
import {
  LogOut, Search, Filter, BarChart3, Shield,
  Check, X, Trash2, ChevronLeft, ChevronRight,
  Image as ImageIcon, Music, Type, Plus, Loader2,
} from 'lucide-react'

interface Submission {
  id: string
  _id: string
  types: string
  text_content: string | null
  image_urls: string | null
  audio_url: string | null
  nickname: string | null
  status: string
  created_at: string
}

interface SensitiveWord {
  id: string
  _id: string
  word: string
  created_at: string
}

interface Stats {
  total: number
  approved: number
  rejected: number
  pending: number
  byType: { text: number; image: number; audio: number }
}

type Tab = 'submissions' | 'sensitive' | 'stats'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'submissions', label: '投稿管理', icon: <Filter className="w-4 h-4" /> },
  { key: 'sensitive', label: '敏感词管理', icon: <Shield className="w-4 h-4" /> },
  { key: 'stats', label: '数据统计', icon: <BarChart3 className="w-4 h-4" /> },
]

export default function Admin() {
  const navigate = useNavigate()
  const { token, isAuthenticated, logout } = useAdminStore()
  const [activeTab, setActiveTab] = useState<Tab>('submissions')

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin-login')
    }
  }, [isAuthenticated, navigate])

  const handleLogout = () => {
    logout()
    navigate('/admin-login')
  }

  if (!isAuthenticated || !token) return null

  return (
    <div className="min-h-screen night-gradient">
      <header className="sticky top-0 z-30 bg-night-dark/80 backdrop-blur-md border-b border-white/10">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-display text-lg text-cream">晚安计划 · 管理后台</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-cream/50 hover:text-soft-pink text-sm font-body transition-colors"
          >
            <LogOut className="w-4 h-4" />
            退出
          </button>
        </div>
      </header>

      <div className="container max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-body transition-all ${
                activeTab === tab.key
                  ? 'bg-white/10 text-cream'
                  : 'text-cream/40 hover:text-cream/60'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'submissions' && <SubmissionsTab token={token} />}
        {activeTab === 'sensitive' && <SensitiveTab token={token} />}
        {activeTab === 'stats' && <StatsTab token={token} />}
      </div>
    </div>
  )
}

function SubmissionsTab({ token }: { token: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const limit = 10

  const fetchSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (typeFilter) params.set('type', typeFilter)
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/admin/submissions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSubmissions(data.data)
        setTotal(data.total)
      }
    } catch (err) {
      void err
    } finally {
      setLoading(false)
    }
  }, [token, page, typeFilter, statusFilter, search])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  useEffect(() => {
    setPage(1)
  }, [typeFilter, statusFilter, search])

  const totalPages = Math.ceil(total / limit)

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) fetchSubmissions()
    } catch (err) {
      void err
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('确定删除该投稿？')) return
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        setSelected((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        fetchSubmissions()
      }
    } catch (err) {
      void err
    }
  }

  const batchAction = async (action: 'approved' | 'rejected' | 'delete') => {
    if (selected.size === 0) return
    if (!confirm(`确定对 ${selected.size} 条投稿执行此操作？`)) return

    const ids = Array.from(selected)
    try {
      if (action === 'delete') {
        await fetch('/api/admin/submissions/batch', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids }),
        })
      } else {
        await fetch('/api/admin/submissions/batch', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ids, status: action }),
        })
      }
      setSelected(new Set())
      fetchSubmissions()
    } catch (err) {
      void err
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === submissions.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(submissions.map((s) => s._id || s.id)))
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      pending: { label: '待审核', cls: 'bg-warm-yellow/20 text-warm-yellow' },
      approved: { label: '已通过', cls: 'bg-green-400/20 text-green-400' },
      rejected: { label: '已拒绝', cls: 'bg-soft-pink/20 text-soft-pink' },
    }
    const info = map[status] || { label: status, cls: 'bg-white/10 text-cream/50' }
    return <span className={`px-2 py-0.5 rounded-full text-xs font-body ${info.cls}`}>{info.label}</span>
  }

  const typeBadge = (typesStr: string) => {
    try {
      const types: string[] = JSON.parse(typesStr)
      return types.map((t) => {
        const map: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
          text: { label: '文字', icon: <Type className="w-3 h-3" />, cls: 'bg-soft-blue/20 text-soft-blue' },
          image: { label: '图片', icon: <ImageIcon className="w-3 h-3" />, cls: 'bg-light-purple/20 text-light-purple' },
          audio: { label: '音频', icon: <Music className="w-3 h-3" />, cls: 'bg-warm-yellow/20 text-warm-yellow' },
        }
        const info = map[t] || { label: t, icon: null, cls: 'bg-white/10 text-cream/50' }
        return (
          <span key={t} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body ${info.cls}`}>
            {info.icon}{info.label}
          </span>
        )
      })
    } catch {
      return null
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-cream text-sm font-body focus:outline-none focus:border-soft-blue/50"
        >
          <option value="">全部类型</option>
          <option value="text">文字</option>
          <option value="image">图片</option>
          <option value="audio">音频</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-cream text-sm font-body focus:outline-none focus:border-soft-blue/50"
        >
          <option value="">全部状态</option>
          <option value="pending">待审核</option>
          <option value="approved">已通过</option>
          <option value="rejected">已拒绝</option>
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索内容或昵称..."
            className="w-full bg-white/5 border border-white/15 rounded-lg pl-9 pr-3 py-1.5 text-cream text-sm font-body placeholder:text-cream/30 focus:outline-none focus:border-soft-blue/50"
          />
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 rounded-lg bg-white/5 animate-fadeIn">
          <span className="text-cream/60 text-sm font-body">已选 {selected.size} 项</span>
          <button
            onClick={() => batchAction('approved')}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-400/20 text-green-400 text-xs font-body hover:bg-green-400/30 transition-colors"
          >
            <Check className="w-3 h-3" />批量通过
          </button>
          <button
            onClick={() => batchAction('rejected')}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-soft-pink/20 text-soft-pink text-xs font-body hover:bg-soft-pink/30 transition-colors"
          >
            <X className="w-3 h-3" />批量拒绝
          </button>
          <button
            onClick={() => batchAction('delete')}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-400/20 text-red-400 text-xs font-body hover:bg-red-400/30 transition-colors"
          >
            <Trash2 className="w-3 h-3" />批量删除
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 text-soft-blue animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-20 text-cream/30 font-body text-sm">暂无投稿数据</div>
      ) : (
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[40px_80px_1fr_80px_80px_100px_120px] gap-2 px-3 py-2 text-cream/40 text-xs font-body">
            <div className="flex items-center">
              <input type="checkbox" checked={selected.size === submissions.length && submissions.length > 0} onChange={toggleAll} className="rounded" />
            </div>
            <span>ID</span><span>内容</span><span>类型</span><span>状态</span><span>昵称</span><span>操作</span>
          </div>

          {submissions.map((sub) => (
            <div key={sub._id || sub.id} className="glass-card p-3 sm:grid sm:grid-cols-[40px_80px_1fr_80px_80px_100px_120px] sm:gap-2 sm:items-center flex flex-col gap-2">
              <div className="flex items-center gap-2 sm:gap-0">
                <input type="checkbox" checked={selected.has(sub._id || sub.id)} onChange={() => toggleSelect(sub._id || sub.id)} className="rounded" />
                <span className="sm:hidden text-cream/40 text-xs font-body">#{sub._id || sub.id}</span>
                <span className="hidden sm:block text-cream/50 text-xs font-body">#{sub._id || sub.id}</span>
              </div>
              <span className="hidden sm:block text-cream/50 text-xs font-body">#{sub._id || sub.id}</span>
              <p className="text-cream/80 text-sm font-body truncate">
                {sub.text_content || (sub.image_urls ? '[图片投稿]' : '[音频投稿]')}
              </p>
              <div className="flex gap-1">{typeBadge(sub.types)}</div>
              <div>{statusBadge(sub.status)}</div>
              <span className="text-cream/40 text-xs font-body truncate">{sub.nickname || '匿名'}</span>
              <div className="flex items-center gap-1">
                {sub.status !== 'approved' && (
                  <button onClick={() => updateStatus(sub._id || sub.id, 'approved')} className="p-1 rounded hover:bg-green-400/20 text-green-400 transition-colors" title="通过">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                {sub.status !== 'rejected' && (
                  <button onClick={() => updateStatus(sub._id || sub.id, 'rejected')} className="p-1 rounded hover:bg-soft-pink/20 text-soft-pink transition-colors" title="拒绝">
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => deleteItem(sub._id || sub.id)} className="p-1 rounded hover:bg-red-400/20 text-red-400 transition-colors" title="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg bg-white/5 text-cream/50 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-cream/50 text-sm font-body">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg bg-white/5 text-cream/50 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}

function SensitiveTab({ token }: { token: string }) {
  const [words, setWords] = useState<SensitiveWord[]>([])
  const [newWord, setNewWord] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchWords = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/sensitive-words', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setWords(data.words)
    } catch (err) {
      void err
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchWords()
  }, [fetchWords])

  const addWord = async () => {
    if (!newWord.trim()) return
    try {
      const res = await fetch('/api/admin/sensitive-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ word: newWord.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        setNewWord('')
        fetchWords()
      } else {
        alert(data.error || '添加失败')
      }
    } catch (err) {
      void err
    }
  }

  const deleteWord = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/sensitive-words/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) fetchWords()
    } catch (err) {
      void err
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addWord()}
          placeholder="输入新敏感词..."
          className="flex-1 bg-white/5 border border-white/15 rounded-lg px-4 py-2 text-cream text-sm font-body placeholder:text-cream/30 focus:outline-none focus:border-soft-blue/50 focus:ring-1 focus:ring-soft-blue/30 transition-all"
        />
        <button
          onClick={addWord}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-soft-blue/20 text-soft-blue text-sm font-body hover:bg-soft-blue/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-5 h-5 text-soft-blue animate-spin" />
        </div>
      ) : words.length === 0 ? (
        <div className="text-center py-10 text-cream/30 font-body text-sm">暂无敏感词</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {words.map((w) => (
            <span
              key={w._id || w.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-cream/70 text-sm font-body group hover:border-soft-pink/30 transition-colors"
            >
              {w.word}
              <button
                onClick={() => deleteWord(w._id || w.id)}
                className="text-cream/30 hover:text-soft-pink transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function StatsTab({ token }: { token: string }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success) setStats(data.data)
      } catch (err) {
        void err
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [token])

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 text-soft-blue animate-spin" />
      </div>
    )
  }

  if (!stats) return null

  const cards = [
    { label: '总投稿数', value: stats.total, cls: 'border-soft-blue/30 bg-soft-blue/5' },
    { label: '已通过', value: stats.approved, cls: 'border-green-400/30 bg-green-400/5' },
    { label: '已拒绝', value: stats.rejected, cls: 'border-soft-pink/30 bg-soft-pink/5' },
    { label: '待审核', value: stats.pending, cls: 'border-warm-yellow/30 bg-warm-yellow/5' },
  ]

  const typeCards = [
    { label: '文字', value: stats.byType.text, icon: <Type className="w-5 h-5" />, cls: 'text-soft-blue' },
    { label: '图片', value: stats.byType.image, icon: <ImageIcon className="w-5 h-5" />, cls: 'text-light-purple' },
    { label: '音频', value: stats.byType.audio, icon: <Music className="w-5 h-5" />, cls: 'text-warm-yellow' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-xl border p-4 text-center ${c.cls}`}>
            <div className="text-2xl font-bold text-cream font-body">{c.value}</div>
            <div className="text-cream/50 text-xs font-body mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-cream/70 text-sm font-body mb-3">类型分布</h3>
      <div className="grid grid-cols-3 gap-3">
        {typeCards.map((c) => (
          <div key={c.label} className="glass-card p-4 text-center">
            <div className={`flex justify-center mb-2 ${c.cls}`}>{c.icon}</div>
            <div className="text-xl font-bold text-cream font-body">{c.value}</div>
            <div className="text-cream/50 text-xs font-body mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
