const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const fileProcessor = require('../services/fileProcessor');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.xlsx', '.xls', '.csv', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${ext} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// @route   POST /api/upload/file
// @desc    Upload a file for processing
// @access  Private
router.post('/file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const filePath = req.file.path;

    // Process file to validate
    try {
      const processed = await fileProcessor.processFile(filePath);
      
      res.json({
        message: 'File uploaded successfully',
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processed: Object.keys(processed).filter(key => processed[key] !== null).length > 0
      });
    } catch (error) {
      // Delete file if processing fails
      fs.unlinkSync(filePath);
      return res.status(400).json({ 
        message: 'File processing failed', 
        error: error.message 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// @route   GET /api/upload/template
// @desc    Download Excel template
// @access  Private
router.get('/template', async (req, res) => {
  try {
    const templateBuffer = fileProcessor.generateExcelTemplate();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=weekly-schedule-template.xlsx');
    
    res.send(templateBuffer);
  } catch (error) {
    res.status(500).json({ message: 'Template generation failed', error: error.message });
  }
});

module.exports = router;

