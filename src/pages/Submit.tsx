import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Moon, Upload, X, Loader2, Image as ImageIcon, Music } from 'lucide-react'
import StarField from '@/components/StarField'

export default function Submit() {
  const navigate = useNavigate()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const [selectedTypes, setSelectedTypes] = useState<string[]>(['text'])
  const [textContent, setTextContent] = useState('')
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    )
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((f) => f.size <= 20 * 1024 * 1024)
    if (validFiles.length < files.length) {
      setError('部分图片超过20MB限制，已自动过滤')
    }
    setImageFiles((prev) => [...prev, ...validFiles])
    validFiles.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(f)
    })
    if (e.target) e.target.value = ''
  }

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('音频文件不能超过10MB')
      return
    }
    setAudioFile(file)
    if (e.target) e.target.value = ''
  }

  const removeAudio = () => {
    setAudioFile(null)
  }

  const validate = (): boolean => {
    if (selectedTypes.length === 0) {
      setError('请至少选择一种投稿形式')
      return false
    }
    if (selectedTypes.includes('text') && !textContent.trim()) {
      setError('请填写文字内容')
      return false
    }
    if (selectedTypes.includes('image') && imageFiles.length === 0) {
      setError('请上传至少一张图片')
      return false
    }
    if (selectedTypes.includes('audio') && !audioFile) {
      setError('请上传音频文件')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    setError('')
    if (!validate()) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('types', JSON.stringify(selectedTypes))
      if (selectedTypes.includes('text')) {
        formData.append('textContent', textContent.trim())
      }
      if (nickname.trim()) {
        formData.append('nickname', nickname.trim())
      }
      if (selectedTypes.includes('image')) {
        imageFiles.forEach((f) => {
          formData.append('images', f)
        })
      }
      if (selectedTypes.includes('audio') && audioFile) {
        formData.append('audio', audioFile)
      }

      const res = await fetch('/api/submissions', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        navigate('/submit/success')
      } else {
        setError(data.error || '提交失败，请稍后重试')
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const typeOptions = [
    { key: 'text', label: '文字' },
    { key: 'image', label: '图片' },
    { key: 'audio', label: '音频' },
  ]

  return (
    <div className="relative min-h-screen pb-8">
      <StarField />

      <div className="relative z-10 container max-w-lg mx-auto px-4 pt-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Moon className="w-6 h-6 text-warm-yellow" />
            <h1 className="font-display text-2xl sm:text-3xl text-cream">
              海洋二所"晚安计划"
            </h1>
            <Moon className="w-6 h-6 text-warm-yellow" />
          </div>
          <p className="text-soft-blue/50 text-xs font-body">
            h2.io · 第二海洋研究所
          </p>
        </div>

        <div className="glass-card p-5 mb-6">
          <p className="text-cream/80 text-sm leading-relaxed font-body whitespace-pre-line">
            本网站将长期开放，所有投稿均匿名发布(可自愿署名)，内容需积极向上、温暖治愈：{'\n'}
            1. 文字类：晚安祝福、心情随笔、日常小记等；{'\n'}
            2. 音频类：助眠歌单、自然白噪音等；{'\n'}
            3. 视觉类：自然风光、日常随拍、绘图插画等；{'\n'}
            让尽可能多的人都能得到一句"晚安"。
          </p>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-cream/70 text-sm font-body mb-2 block">
              1. 投稿形式 <span className="text-soft-pink">*</span>
            </label>
            <div className="flex flex-wrap gap-3">
              {typeOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => toggleType(opt.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-body transition-all duration-200 border ${
                    selectedTypes.includes(opt.key)
                      ? 'bg-warm-yellow/20 border-warm-yellow text-warm-yellow'
                      : 'bg-white/5 border-white/20 text-cream/50 hover:border-white/40'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                      selectedTypes.includes(opt.key)
                        ? 'border-warm-yellow bg-warm-yellow'
                        : 'border-white/30'
                    }`}
                  >
                    {selectedTypes.includes(opt.key) && (
                      <svg className="w-2.5 h-2.5 text-night-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {selectedTypes.includes('text') && (
            <div className="animate-fadeIn">
              <label className="text-cream/70 text-sm font-body mb-2 block">
                2. 文字投稿 <span className="text-soft-pink">*</span>
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="写下你想说的晚安..."
                rows={4}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-cream placeholder:text-cream/30 font-body text-sm focus:outline-none focus:border-warm-yellow/50 focus:ring-1 focus:ring-warm-yellow/30 resize-none transition-all"
              />
            </div>
          )}

          {selectedTypes.includes('image') && (
            <div className="animate-fadeIn">
              <label className="text-cream/70 text-sm font-body mb-2 block">
                图片投稿 <span className="text-soft-pink">*</span>
              </label>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleImageChange}
              />
              <div className="grid grid-cols-3 gap-2">
                {imagePreviews.map((src, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={src} alt={`预览 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-6 h-6 bg-night-dark/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3.5 h-3.5 text-cream" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 hover:border-warm-yellow/50 hover:bg-white/5 transition-all"
                >
                  <ImageIcon className="w-6 h-6 text-cream/30" />
                  <span className="text-cream/30 text-xs">添加图片</span>
                </button>
              </div>
              <p className="text-cream/30 text-xs mt-1">支持 jpg/png/webp，单张最大20MB</p>
            </div>
          )}

          {selectedTypes.includes('audio') && (
            <div className="animate-fadeIn">
              <label className="text-cream/70 text-sm font-body mb-2 block">
                音频投稿 <span className="text-soft-pink">*</span>
              </label>
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/mpeg,audio/wav"
                onChange={handleAudioChange}
              />
              {audioFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/15">
                  <Music className="w-5 h-5 text-soft-blue flex-shrink-0" />
                  <span className="text-cream/80 text-sm font-body flex-1 truncate">
                    {audioFile.name}
                  </span>
                  <button onClick={removeAudio} className="text-cream/40 hover:text-soft-pink transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center gap-2 hover:border-soft-blue/50 hover:bg-white/5 transition-all"
                >
                  <Upload className="w-6 h-6 text-cream/30" />
                  <span className="text-cream/30 text-sm">点击上传音频</span>
                </button>
              )}
              <p className="text-cream/30 text-xs mt-1">支持 mp3/wav，最大10MB</p>
            </div>
          )}

          <div>
            <label className="text-cream/70 text-sm font-body mb-2 block">
              3. 昵称(选填)
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="不填则匿名发布"
              maxLength={20}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-cream placeholder:text-cream/30 font-body text-sm focus:outline-none focus:border-warm-yellow/50 focus:ring-1 focus:ring-warm-yellow/30 transition-all"
            />
          </div>

          {error && (
            <div className="text-soft-pink text-sm font-body animate-fadeIn">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-warm-yellow to-soft-pink text-night-dark font-body font-medium text-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                提交中...
              </>
            ) : (
              '投递晚安'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
