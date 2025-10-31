const express = require('express');
const { queryPDF } = require('../controller/queryController');
const router = express.Router();

router.post('/query',queryPDF)

module.exports = router;
