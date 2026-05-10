import { Router, type Request, type Response } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import {
  getSubmissions,
  updateSubmissionStatus,
  deleteSubmission,
  batchUpdateStatus,
  batchDeleteSubmissions,
  getSensitiveWords,
  addSensitiveWord,
  deleteSensitiveWord,
  getAdminUser,
  getStats,
  initAdminUser,
  initSensitiveWords
} from '../db.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'goodnight-secret-key-h2io-2024'

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    const admin = await getAdminUser(username)
    if (!admin) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const isValid = bcrypt.compareSync(password, admin.password_hash)
    if (!isValid) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    const token = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ success: true, token, username })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/submissions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, status, search, page = '1', limit = '20' } = req.query

    const result = await getSubmissions({
      type: type as string,
      status: status as string,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    })

    res.json({ success: true, data: result.data, pagination: { total: result.total, page: result.page, limit: result.limit } })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.put('/submissions/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

    const success = await updateSubmissionStatus(id, status)
    if (success) {
      res.json({ success: true, message: '状态更新成功' })
    } else {
      res.status(404).json({ success: false, error: '投稿不存在' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/submissions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const success = await deleteSubmission(id)
    if (success) {
      res.json({ success: true, message: '删除成功' })
    } else {
      res.status(404).json({ success: false, error: '投稿不存在' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/submissions/batch/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) {
      res.status(400).json({ success: false, error: 'ids 必须是数组' })
      return
    }

    const count = await batchUpdateStatus(ids, 'approved')
    res.json({ success: true, message: `成功通过 ${count} 条投稿`, count })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/submissions/batch/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) {
      res.status(400).json({ success: false, error: 'ids 必须是数组' })
      return
    }

    const count = await batchUpdateStatus(ids, 'rejected')
    res.json({ success: true, message: `成功拒绝 ${count} 条投稿`, count })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/submissions/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids)) {
      res.status(400).json({ success: false, error: 'ids 必须是数组' })
      return
    }

    const count = await batchDeleteSubmissions(ids)
    res.json({ success: true, message: `成功删除 ${count} 条投稿`, count })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/sensitive-words', async (req: Request, res: Response): Promise<void> => {
  try {
    const words = await getSensitiveWords()
    res.json({ success: true, data: words })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/sensitive-words', async (req: Request, res: Response): Promise<void> => {
  try {
    const { word } = req.body
    if (!word || word.trim() === '') {
      res.status(400).json({ success: false, error: '敏感词不能为空' })
      return
    }

    const id = await addSensitiveWord(word.trim())
    if (id) {
      res.json({ success: true, message: '添加成功', id })
    } else {
      res.status(500).json({ success: false, error: '添加失败' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.delete('/sensitive-words/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const success = await deleteSensitiveWord(id)
    if (success) {
      res.json({ success: true, message: '删除成功' })
    } else {
      res.status(404).json({ success: false, error: '敏感词不存在' })
    }
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getStats()
    res.json({ success: true, data: stats })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/init', async (req: Request, res: Response): Promise<void> => {
  try {
    await initAdminUser()
    await initSensitiveWords()
    res.json({ success: true, message: '初始化完成' })
  } catch (error) {
    res.status(500).json({ success: false, error: '初始化失败' })
  }
})

export default router
