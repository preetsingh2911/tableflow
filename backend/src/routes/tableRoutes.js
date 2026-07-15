/**
 * Table Routes
 */
const express = require('express');
const router = express.Router();
const { authenticate, authorize, requireBusinessOwnership } = require('../middleware/authMiddleware');
const { checkSubscription } = require('../middleware/checkSubscription');
const { tableRules, idParam, validate } = require('../utils/validators');
const tableController = require('../controllers/tableController');

router.use(authenticate, authorize('business_owner', 'platform_admin'), requireBusinessOwnership, checkSubscription);

router.get('/', tableController.listTables);
router.get('/:id', idParam, validate, tableController.getTable);
router.post('/', tableRules, validate, tableController.createTable);
router.put('/:id', idParam, validate, tableController.updateTable);
router.delete('/:id', idParam, validate, tableController.deleteTable);

module.exports = router;
