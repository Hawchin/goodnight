import { Music, Image as ImageIcon } from 'lucide-react'

interface SubmissionCardProps {
  type: string[]
  content: string | null
  imageUrl: string[] | null
  audioUrl: string | null
  nickname: string | null
  createdAt: string
}

export default function SubmissionCard({
  type,
  content,
  imageUrl,
  audioUrl,
  nickname,
  createdAt,
}: SubmissionCardProps) {
  return (
    <div className="glass-card-light p-6 animate-slideUp w-full max-w-md mx-auto">
      {type.includes('text') && content && (
        <div className="text-center mb-4">
          <p className="text-cream text-lg leading-relaxed font-body whitespace-pre-wrap">
            {content}
          </p>
        </div>
      )}

      {type.includes('image') && imageUrl && imageUrl.length > 0 && (
        <div className="mb-4 space-y-2">
          {imageUrl.map((url, i) => (
            <div key={i} className="rounded-lg overflow-hidden">
              <img
                src={url}
                alt={`投稿图片 ${i + 1}`}
                className="w-full h-auto max-h-80 object-cover rounded-lg"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      )}

      {type.includes('audio') && audioUrl && (
        <div className="mb-4 flex items-center gap-3 p-3 rounded-lg bg-white/5">
          <Music className="w-5 h-5 text-soft-blue flex-shrink-0" />
          <audio controls className="w-full h-8" preload="none">
            <source src={audioUrl} />
          </audio>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-cream/50 pt-3 border-t border-white/10">
        <span className="flex items-center gap-1.5">
          {type.includes('image') && <ImageIcon className="w-3.5 h-3.5" />}
          {type.includes('audio') && <Music className="w-3.5 h-3.5" />}
          {nickname || '匿名'}
        </span>
        <span>{new Date(createdAt).toLocaleDateString('zh-CN')}</span>
      </div>
    </div>
  )
}
