import { Router, Request, Response } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { auth, AuthRequest } from '../middleware/auth.middleware.js'

const router = Router()

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents')
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  }
})

// Separate storage for logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/logos')
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    cb(null, `logo-${uniqueSuffix}${ext}`)
  }
})

// File filter for images only
const imageFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG and WebP images are allowed.'))
  }
}

const logoUpload = multer({
  storage: logoStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
})

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WebP and PDF files are allowed.'))
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
})

/**
 * @route POST /api/upload/document
 * @desc Upload a business document (registration certificate, PAN, etc.)
 * @access Private
 */
router.post('/document', auth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    const { type } = req.body // registration_certificate, pan_certificate, owner_id

    if (!type) {
      // Delete the uploaded file if type is not provided
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ error: 'Document type is required' })
    }

    // Generate URL for the uploaded file
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`


    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type,
    })
  } catch (error: any) {
    console.error('[Upload] Error:', error.message)
    
    // Clean up file if it was uploaded
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    
    res.status(500).json({ error: error.message || 'Failed to upload document' })
  }
})

/**
 * @route DELETE /api/upload/document/:filename
 * @desc Delete an uploaded document
 * @access Private
 */
router.delete('/document/:filename', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    let { filename } = req.params
    if (Array.isArray(filename) || !filename) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    const filePath = path.join(__dirname, '../../uploads/documents', filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    fs.unlinkSync(filePath)

    res.json({ success: true, message: 'Document deleted successfully' })
  } catch (error: any) {
    console.error('[Upload] Delete error:', error.message)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

/**
 * @route POST /api/upload/logo
 * @desc Upload a business logo
 * @access Private
 */
router.post('/logo', auth, logoUpload.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Generate URL for the uploaded file
    const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`
    const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`


    res.json({
      success: true,
      logoUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
    })
  } catch (error: any) {
    console.error('[Upload] Logo error:', error.message)
    
    // Clean up file if it was uploaded
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    
    res.status(500).json({ error: error.message || 'Failed to upload logo' })
  }
})

/**
 * @route DELETE /api/upload/logo/:filename
 * @desc Delete a business logo
 * @access Private
 */
router.delete('/logo/:filename', auth, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id || req.userId
    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    let { filename } = req.params
    if (Array.isArray(filename) || !filename) {
      return res.status(400).json({ error: 'Invalid filename' })
    }
    const filePath = path.join(__dirname, '../../uploads/logos', filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    fs.unlinkSync(filePath)

    res.json({ success: true, message: 'Logo deleted successfully' })
  } catch (error: any) {
    console.error('[Upload] Logo delete error:', error.message)
    res.status(500).json({ error: 'Failed to delete logo' })
  }
})

export default router
