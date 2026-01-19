const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');

router.get('/', supportController.getSupport);

module.exports = router;
