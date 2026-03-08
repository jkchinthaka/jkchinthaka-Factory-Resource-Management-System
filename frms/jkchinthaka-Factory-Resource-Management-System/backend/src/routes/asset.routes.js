const router = require('express').Router();
const ctrl = require('../controllers/asset.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, assetSchema } = require('../middlewares/validate.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', authorize('Admin'), validate(assetSchema), auditLog('create', 'assets'), ctrl.create);
router.put('/:id', authorize('Admin'), validate(assetSchema), auditLog('update', 'assets'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('delete', 'assets'), ctrl.remove);

module.exports = router;
