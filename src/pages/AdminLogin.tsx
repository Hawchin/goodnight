import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminStore } from '@/stores/adminStore'
import { Shield, Loader2 } from 'lucide-react'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useAdminStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()

      if (data.success && data.token) {
        login(data.token)
        navigate('/admin')
      } else {
        setError(data.error || '登录失败')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 night-gradient">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-soft-blue" />
            <h1 className="font-display text-xl text-cream">管理后台</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="用户名"
                required
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 font-body text-sm focus:outline-none focus:border-soft-blue/50 focus:ring-1 focus:ring-soft-blue/30 transition-all"
              />
            </div>
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                required
                className="w-full bg-white/5 border border-white/15 rounded-lg px-4 py-2.5 text-cream placeholder:text-cream/30 font-body text-sm focus:outline-none focus:border-soft-blue/50 focus:ring-1 focus:ring-soft-blue/30 transition-all"
              />
            </div>

            {error && (
              <p className="text-soft-pink text-sm font-body">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-soft-blue/20 border border-soft-blue/30 text-soft-blue font-body text-sm hover:bg-soft-blue/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
