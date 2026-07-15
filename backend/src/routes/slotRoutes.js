/**
 * Time Slot Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/checkSubscription');
const { slotRules, idParam, validate } = require('../utils/validators');
const slotController = require('../controllers/slotController');

router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership, checkSubscription);

router.get('/', slotController.listSlots);
router.post('/', slotController.createSlot);
router.post('/bulk', slotController.createBulkSlots);
router.put('/:id', idParam, validate, slotController.updateSlot);
router.delete('/:id', idParam, validate, slotController.deleteSlot);

module.exports = router;
