const express = require('express');
const {
  createReel,
  getReels,
  getReelById,
  updateReel,
  deleteReel,
} = require('../controllers/reelController');
const { protect, admin, optionalProtect } = require('../middleware/authMiddleware');

const router = express.Router();

router
  .route('/')
  .post(protect, admin, createReel)
  .get(optionalProtect, getReels);

router
  .route('/:id')
  .get(optionalProtect, getReelById)
  .put(protect, admin, updateReel)
  .delete(protect, admin, deleteReel);

module.exports = router;
