const express = require('express');
const { listActiveCategories } = require('../controllers/categoryController');

const router = express.Router();

router.get('/', listActiveCategories);

module.exports = router;