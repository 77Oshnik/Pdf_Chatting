const express = require('express');
const { queryPDF } = require('../controller/query-controller');
const router = express.Router();

router.post('/query',queryPDF)

module.exports = router;
