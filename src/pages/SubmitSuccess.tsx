import { useNavigate } from 'react-router-dom'
import { Home, PenLine } from 'lucide-react'
import StarField from '@/components/StarField'

export default function SubmitSuccess() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <StarField />

      <div className="relative z-10 text-center animate-fadeIn">
        <div className="text-6xl mb-6 animate-bounceIn">✨</div>
        <h2 className="font-display text-2xl text-cream mb-3">
          你的晚安已成功投递
        </h2>
        <p className="text-cream/60 font-body text-sm mb-10">
          感谢分享温暖✨
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full glass-card-light text-cream font-body text-sm hover:bg-white/20 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
          <button
            onClick={() => navigate('/submit')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-warm-yellow to-soft-pink text-night-dark font-body text-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <PenLine className="w-4 h-4" />
            再次投稿
          </button>
        </div>
      </div>
    </div>
  )
}
