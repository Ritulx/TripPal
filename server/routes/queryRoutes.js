const express = require('express');
const {
  getQueries,
  createQuery,
  replyToQuery,
  deleteQuery,
} = require('../controllers/queryController');
const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { param, body } = require('express-validator');

const router = express.Router();

const placeIdValidator = [param('placeId').isMongoId().withMessage('Invalid place id')];
const queryIdValidator = [param('queryId').isMongoId().withMessage('Invalid query id')];
const textValidator = [
  body('text')
    .trim()
    .isLength({ min: 3, max: 500 })
    .withMessage('Text must be between 3 and 500 characters'),
];

router.get('/place/:placeId', placeIdValidator, validateRequest, getQueries);
router.post('/place/:placeId', protect, placeIdValidator, textValidator, validateRequest, createQuery);

router.post('/:queryId/replies', protect, queryIdValidator, textValidator, validateRequest, replyToQuery);
router.delete('/:queryId', protect, queryIdValidator, validateRequest, deleteQuery);

module.exports = router;
