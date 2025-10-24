const express = require('express');
const multer = require('multer');
const router = express.Router();
const { uploadPDF } = require('../controller/upload-controller');
const fs = require('fs');
const { uploadPDFValidator } = require('../validator/uploadValidator');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null,Date.now() + '-' +file.originalname);
  },
});

const upload = multer({ storage });

if(!fs.existsSync('uploads')){
    fs.mkdirSync('uploads');
}

router.post('/upload', upload.single('file'), ...uploadPDFValidator, uploadPDF);

module.exports = router;