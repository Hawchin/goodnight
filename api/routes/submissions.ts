import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import sharp from 'sharp'
import { getRandomApprovedSubmission, createSubmission } from '../db.js'
import { containsSensitiveContent } from '../middleware/sensitiveFilter.js'

const router = Router()

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'audio') {
        cb(null, path.join(process.cwd(), 'uploads', 'audio'))
      } else {
        cb(null, path.join(process.cwd(), 'uploads', 'images'))
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname)
      const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`
      cb(null, name)
    }
  }),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'audio') {
      const allowed = ['.mp3', '.wav']
      const ext = path.extname(file.originalname).toLowerCase()
      if (allowed.includes(ext)) {
        cb(null, true)
      } else {
        cb(new Error('仅支持 mp3/wav 格式的音频'))
      }
    } else if (file.fieldname === 'images') {
      const allowed = ['.jpg', '.jpeg', '.png', '.webp']
      const ext = path.extname(file.originalname).toLowerCase()
      if (allowed.includes(ext)) {
        cb(null, true)
      } else {
        cb(new Error('仅支持 jpg/png/webp 格式的图片'))
      }
    } else {
      cb(null, true)
    }
  }
})

const cpUpload = upload.fields([
  { name: 'images', maxCount: 9 },
  { name: 'audio', maxCount: 1 }
])

router.get('/random', (req: Request, res: Response): void => {
  try {
    const submission = getRandomApprovedSubmission()
    if (!submission) {
      res.status(404).json({ success: false, error: '暂无已审核的投稿' })
      return
    }
    res.json({ success: true, data: submission })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.post('/', cpUpload, async (req: Request, res: Response): Promise<void> => {
  try {
    const { types, textContent, nickname } = req.body
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined

    let parsedTypes: string[]
    try {
      parsedTypes = JSON.parse(types)
      if (!Array.isArray(parsedTypes) || parsedTypes.length === 0) {
        res.status(400).json({ success: false, error: 'types 必须是非空数组' })
        return
      }
    } catch {
      res.status(400).json({ success: false, error: 'types 格式无效' })
      return
    }

    const imageFiles = files?.['images'] || []
    const audioFiles = files?.['audio'] || []

    const imageUrls: string[] = []
    for (const img of imageFiles) {
      try {
        const outputPath = path.join(process.cwd(), 'uploads', 'images', `compressed-${img.filename}`)
        await sharp(img.path)
          .resize({ width: 1200, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(outputPath)
        imageUrls.push(`/uploads/images/compressed-${img.filename}`)
      } catch {
        imageUrls.push(`/uploads/images/${img.filename}`)
      }
    }

    let audioUrl: string | null = null
    if (audioFiles.length > 0) {
      audioUrl = `/uploads/audio/${audioFiles[0].filename}`
    }

    const hasMedia = imageUrls.length > 0 || audioUrl !== null
    const isSensitive = containsSensitiveContent(textContent || '')

    let status: string
    if (isSensitive) {
      status = 'rejected'
    } else if (hasMedia) {
      status = 'pending'
    } else {
      status = 'pending'
    }

    const id = createSubmission({
      types: JSON.stringify(parsedTypes),
      text_content: textContent || null,
      image_urls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
      audio_url: audioUrl,
      nickname: nickname || null,
      status
    })

    res.json({
      success: true,
      message: isSensitive ? '投稿已提交，但包含敏感内容' : '投稿已提交，等待审核',
      id
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
