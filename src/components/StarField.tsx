import { useMemo } from 'react'

interface Star {
  x: number
  y: number
  size: number
  duration: number
  delay: number
  opacity: number
}

export default function StarField() {
  const stars = useMemo(() => {
    const result: Star[] = []
    for (let i = 0; i < 120; i++) {
      result.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 5,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }
    return result
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {stars.map((star, i) => (
        <div
          key={i}
          className="star"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            '--duration': `${star.duration}s`,
            '--delay': `${star.delay}s`,
            opacity: star.opacity,
          } as React.CSSProperties}
        />
      ))}
      <div
        className="absolute top-[15%] right-[10%] w-20 h-20 rounded-full opacity-10"
        style={{
          background: 'radial-gradient(circle, #FFD6A5 0%, transparent 70%)',
          filter: 'blur(8px)',
        }}
      />
      <div
        className="absolute bottom-[20%] left-[5%] w-32 h-32 rounded-full opacity-5"
        style={{
          background: 'radial-gradient(circle, #A8D8EA 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
      />
    </div>
  )
}
