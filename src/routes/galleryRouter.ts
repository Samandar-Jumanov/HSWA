import express from 'express';
import multer from 'multer';
import { uploadFile } from '../../config/weaviate';
import { authMiddleware } from '../middlewares/authMiddlewares';

const galleryRouter  = express.Router();

// Use memory storage instead of disk storage
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req: any, file: any, cb: any) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Initialize multer upload
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Handle file upload
galleryRouter .post('/upload',   upload.single('image'), authMiddleware(["admin"]),  async (req: any, res: any) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file provided' 
      });
    }
    
    // Use the buffer that multer already provides
    const imageBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    
    // Call uploadFile with the exact parameters it expects
    const result = await uploadFile(imageBuffer, fileName);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      fileInfo: {
        originalName: fileName,
        size: req.file.size,
        mimeType: req.file.mimetype
      },
      weaviateResult: result
    });
    
  } catch (error : any ) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  } finally {
    // No need to clean up files since we're using memory storage
  }
});

// Error handler for multer errors
galleryRouter .use((err : any , req : any , res : any , next : any ) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // For other errors
  return res.status(500).json({
    success: false,
    message: err.message
  });
});

export default galleryRouter ;