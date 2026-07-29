"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure multer for file storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/documents');
        // Create directory if it doesn't exist
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});
// Separate storage for logos
const logoStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(__dirname, '../../uploads/logos');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `logo-${uniqueSuffix}${ext}`);
    }
});
// File filter for images only
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPG, PNG and WebP images are allowed.'));
    }
};
const logoUpload = (0, multer_1.default)({
    storage: logoStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error('Invalid file type. Only JPG, PNG, WebP and PDF files are allowed.'));
    }
};
const upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});
/**
 * @route POST /api/upload/document
 * @desc Upload a business document (registration certificate, PAN, etc.)
 * @access Private
 */
router.post('/document', auth_middleware_1.auth, upload.single('file'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { type } = req.body; // registration_certificate, pan_certificate, owner_id
        if (!type) {
            // Delete the uploaded file if type is not provided
            fs_1.default.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Document type is required' });
        }
        // Generate URL for the uploaded file
        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`;
        const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;
        console.log(`[Upload] Document uploaded: ${type} for user ${userId}`);
        console.log(`[Upload] File path: ${req.file.path}`);
        console.log(`[Upload] File URL: ${fileUrl}`);
        res.json({
            success: true,
            url: fileUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            type,
        });
    }
    catch (error) {
        console.error('[Upload] Error:', error.message);
        // Clean up file if it was uploaded
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
}));
/**
 * @route DELETE /api/upload/document/:filename
 * @desc Delete an uploaded document
 * @access Private
 */
router.delete('/document/:filename', auth_middleware_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        let { filename } = req.params;
        if (Array.isArray(filename) || !filename) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        const filePath = path_1.default.join(__dirname, '../../uploads/documents', filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        fs_1.default.unlinkSync(filePath);
        console.log(`[Upload] Document deleted: ${filename} by user ${userId}`);
        res.json({ success: true, message: 'Document deleted successfully' });
    }
    catch (error) {
        console.error('[Upload] Delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete document' });
    }
}));
/**
 * @route POST /api/upload/logo
 * @desc Upload a business logo
 * @access Private
 */
router.post('/logo', auth_middleware_1.auth, logoUpload.single('logo'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Generate URL for the uploaded file
        const baseUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 5001}`;
        const logoUrl = `${baseUrl}/uploads/logos/${req.file.filename}`;
        console.log(`[Upload] Logo uploaded for user ${userId}`);
        console.log(`[Upload] File path: ${req.file.path}`);
        console.log(`[Upload] Logo URL: ${logoUrl}`);
        res.json({
            success: true,
            logoUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
        });
    }
    catch (error) {
        console.error('[Upload] Logo error:', error.message);
        // Clean up file if it was uploaded
        if (req.file && fs_1.default.existsSync(req.file.path)) {
            fs_1.default.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: error.message || 'Failed to upload logo' });
    }
}));
/**
 * @route DELETE /api/upload/logo/:filename
 * @desc Delete a business logo
 * @access Private
 */
router.delete('/logo/:filename', auth_middleware_1.auth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        let { filename } = req.params;
        if (Array.isArray(filename) || !filename) {
            return res.status(400).json({ error: 'Invalid filename' });
        }
        const filePath = path_1.default.join(__dirname, '../../uploads/logos', filename);
        if (!fs_1.default.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        fs_1.default.unlinkSync(filePath);
        console.log(`[Upload] Logo deleted: ${filename} by user ${userId}`);
        res.json({ success: true, message: 'Logo deleted successfully' });
    }
    catch (error) {
        console.error('[Upload] Logo delete error:', error.message);
        res.status(500).json({ error: 'Failed to delete logo' });
    }
}));
exports.default = router;
