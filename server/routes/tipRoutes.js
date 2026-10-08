const express = require('express');
const {
  createTip,
  getTipsForPlace,
  updateTip,
  deleteTip,
  voteTip,
  flagTip,
  getMyTips,
} = require('../controllers/tipController');

const { protect } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const {
  createTipValidator,
  updateTipValidator,
  tipIdValidator,
  placeIdParamValidator,
  voteValidator,
  listTipsQueryValidator,
} = require('../middleware/validators/tipValidators');

const router = express.Router();

// requireVerifiedLocal is gone — createTip now checks place-scoped local
// status internally, since the check needs the place's coordinates.
router.post('/', protect, createTipValidator, validateRequest, createTip);
router.get('/mine', protect, getMyTips);
router.get('/place/:placeId', placeIdParamValidator, listTipsQueryValidator, validateRequest, getTipsForPlace);
router.patch('/:id', protect, updateTipValidator, validateRequest, updateTip);
router.delete('/:id', protect, tipIdValidator, validateRequest, deleteTip);
router.patch('/:id/vote', protect, voteValidator, validateRequest, voteTip);
router.patch('/:id/flag', protect, tipIdValidator, validateRequest, flagTip);

module.exports = router;