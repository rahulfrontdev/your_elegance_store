const express = require('express');
const { getUsers, getUserById, updateUser } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, admin);

router.route('/').get(getUsers);
router.route('/:id').get(getUserById).patch(updateUser);

module.exports = router;
