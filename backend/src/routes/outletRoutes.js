/**
 * Outlet Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/checkSubscription');
const { outletRules, idParam, validate } = require('../utils/validators');
const outletController = require('../controllers/outletController');

router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership, checkSubscription);

router.get('/', outletController.listOutlets);
router.get('/:id', idParam, validate, outletController.getOutlet);
router.post('/', outletRules, validate, outletController.createOutlet);
router.put('/:id', idParam, validate, outletController.updateOutlet);
router.delete('/:id', idParam, validate, outletController.deleteOutlet);

module.exports = router;
