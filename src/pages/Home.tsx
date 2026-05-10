import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Moon, Send, Loader2 } from 'lucide-react'
import StarField from '@/components/StarField'
import SubmissionCard from '@/components/SubmissionCard'

interface ParsedSubmission {
  id: string
  types: string[]
  text_content: string | null
  image_urls: string[] | null
  audio_url: string | null
  nickname: string | null
  status: string
  created_at: string
}

export default function Home() {
  const [submission, setSubmission] = useState<ParsedSubmission | null>(null)
  const [loading, setLoading] = useState(false)
  const [noContent, setNoContent] = useState(false)

  const fetchRandom = async () => {
    setLoading(true)
    setNoContent(false)
    setSubmission(null)
    try {
      const res = await fetch('/api/submissions/random')
      const data = await res.json()
      if (data.success && data.data) {
        const sub = data.data
        const parsedTypes: string[] = JSON.parse(sub.types || '[]')
        const parsedImages: string[] | null = sub.image_urls ? JSON.parse(sub.image_urls) : null
        setSubmission({
          id: sub._id || sub.id,
          types: parsedTypes,
          text_content: sub.text_content,
          image_urls: parsedImages,
          audio_url: sub.audio_url,
          nickname: sub.nickname,
          status: sub.status,
          created_at: sub.created_at,
        })
      } else {
        setNoContent(true)
      }
    } catch {
      setNoContent(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <StarField />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg py-20">
        <h1 className="font-display text-3xl sm:text-4xl text-cream mb-2 tracking-wide">
          海洋二所晚安计划
        </h1>
        <p className="text-soft-blue/60 text-sm mb-12 font-body">
          让每一个人都能得到一句晚安
        </p>

        <button
          onClick={fetchRandom}
          disabled={loading}
          className="animate-float group relative w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-warm-yellow to-soft-pink flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed warm-glow"
        >
          {loading ? (
            <Loader2 className="w-10 h-10 text-night-dark animate-spin" />
          ) : (
            <>
              <Moon className="w-10 h-10 text-night-dark group-hover:scale-110 transition-transform" />
              <span className="text-night-dark font-body font-medium text-sm">
                获取一句晚安
              </span>
            </>
          )}
        </button>

        <div className="mt-10 w-full">
          {submission && (
            <SubmissionCard
              type={submission.types}
              content={submission.text_content}
              imageUrl={submission.image_urls}
              audioUrl={submission.audio_url}
              nickname={submission.nickname}
              createdAt={submission.created_at}
            />
          )}

          {noContent && (
            <div className="glass-card p-6 text-center animate-fadeIn">
              <p className="text-cream/70 font-body">
                还没有晚安投稿，快来投递第一句吧 ✨
              </p>
            </div>
          )}
        </div>
      </div>

      <Link
        to="/submit"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-6 py-3 rounded-full glass-card-light text-cream font-body text-sm hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95 soft-glow"
      >
        <Send className="w-4 h-4" />
        投递你的晚安
      </Link>
    </div>
  )
}
