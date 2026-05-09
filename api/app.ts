import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import './db.js'
import submissionRoutes from './routes/submissions.js'
import adminRoutes from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

const submissionRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method !== 'POST') {
    next()
    return
  }

  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60 * 1000 })
    next()
    return
  }

  if (record.count >= 3) {
    res.status(429).json({ success: false, error: '请求过于频繁，请稍后再试' })
    return
  }

  record.count++
  next()
}

app.use('/api/submissions', submissionRateLimit, submissionRoutes)
app.use('/api/admin', adminRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error.message && (error.message.includes('仅支持') || error.message.includes('格式'))) {
    res.status(400).json({
      success: false,
      error: error.message,
    })
    return
  }
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
