/**
 * File Management Controller
 */

const FileService = require('../../services/fileService');
const { ValidationError } = require('../../utils/errors');

// @desc    Upload file
// @route   POST /api/files/upload
// @access  Private
exports.uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const fileInfo = await FileService.getFileInfo(req.file.path);

    res.status(200).json({
      status: 'success',
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: fileInfo.size,
        sizeFormatted: FileService.formatFileSize(fileInfo.size),
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete file
// @route   DELETE /api/files/:filename
// @access  Private/Admin,Staff
exports.deleteFile = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    await FileService.deleteFile(filePath);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get file info
// @route   GET /api/files/:filename/info
// @access  Private
exports.getFileInfo = async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', filename);

    const fileInfo = await FileService.getFileInfo(filePath);

    res.status(200).json({
      status: 'success',
      data: {
        ...fileInfo,
        sizeFormatted: FileService.formatFileSize(fileInfo.size),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cleanup old files (admin)
// @route   POST /api/files/cleanup
// @access  Private/Admin
exports.cleanupOldFiles = async (req, res, next) => {
  try {
    const { directory, maxAgeDays } = req.body;
    
    if (!directory) {
      throw new ValidationError('Directory is required');
    }

    const result = await FileService.cleanupOldFiles(directory, maxAgeDays || 30);

    res.status(200).json({
      status: 'success',
      message: 'Cleanup completed',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
