import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { authenticate, type AuthRequest, JWT_SECRET } from '../middleware/auth.js'
import {
  getAdminUser,
  getSubmissions,
  getSubmissionById,
  updateSubmissionStatus,
  deleteSubmission,
  batchUpdateStatus,
  batchDeleteSubmissions,
  getSensitiveWords,
  addSensitiveWord,
  deleteSensitiveWord,
  getStats
} from '../db.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      res.status(400).json({ success: false, error: '请提供用户名和密码' })
      return
    }

    const user = getAdminUser(username)
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ success: true, token })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.use(authenticate)

router.get('/submissions', (req: AuthRequest, res: Response): void => {
  try {
    const type = req.query.type as string | undefined
    const status = req.query.status as string | undefined
    const search = req.query.search as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20

    const result = getSubmissions({ type, status, search, page, limit })
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/submissions/batch', (req: AuthRequest, res: Response): void => {
  try {
    const { ids, status } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: '请提供有效的ID列表' })
      return
    }
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: '状态必须为 approved 或 rejected' })
      return
    }

    const count = batchUpdateStatus(ids, status)
    res.json({ success: true, count })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/submissions/batch', (req: AuthRequest, res: Response): void => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, error: '请提供有效的ID列表' })
      return
    }

    const count = batchDeleteSubmissions(ids)
    res.json({ success: true, count })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/submissions/:id/status', (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id)
    const { status } = req.body

    if (isNaN(id)) {
      res.status(400).json({ success: false, error: '无效的ID' })
      return
    }
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: '状态必须为 approved 或 rejected' })
      return
    }

    const submission = getSubmissionById(id)
    if (!submission) {
      res.status(404).json({ success: false, error: '投稿不存在' })
      return
    }

    updateSubmissionStatus(id, status)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/submissions/:id', (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: '无效的ID' })
      return
    }

    const submission = getSubmissionById(id)
    if (!submission) {
      res.status(404).json({ success: false, error: '投稿不存在' })
      return
    }

    deleteSubmission(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/sensitive-words', (req: AuthRequest, res: Response): void => {
  try {
    const words = getSensitiveWords()
    res.json({ success: true, words })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/sensitive-words', (req: AuthRequest, res: Response): void => {
  try {
    const { word } = req.body
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      res.status(400).json({ success: false, error: '请提供有效的敏感词' })
      return
    }

    const id = addSensitiveWord(word.trim())
    res.json({ success: true, id })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      res.status(409).json({ success: false, error: '该敏感词已存在' })
      return
    }
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/sensitive-words/:id', (req: AuthRequest, res: Response): void => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) {
      res.status(400).json({ success: false, error: '无效的ID' })
      return
    }

    deleteSensitiveWord(id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/stats', (req: AuthRequest, res: Response): void => {
  try {
    const stats = getStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
