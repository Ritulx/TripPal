const express = require('express');
const { getMyNotifications, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { param } = require('express-validator');

const router = express.Router();

router.use(protect); // All notification routes require authentication

router.get('/', getMyNotifications);
router.patch('/read-all', markAllAsRead);

const idValidator = [param('id').isMongoId().withMessage('Invalid notification id')];
router.patch('/:id/read', idValidator, validateRequest, markAsRead);

module.exports = router;
