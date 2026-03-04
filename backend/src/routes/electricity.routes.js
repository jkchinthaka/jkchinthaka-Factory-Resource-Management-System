const router = require('express').Router();
const ctrl = require('../controllers/electricity.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, electricitySchema } = require('../middlewares/validate.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/trend', ctrl.getMonthlyTrend);
router.get('/:id', ctrl.getById);
router.post('/', authorize('Admin', 'Manager', 'Data Entry'), validate(electricitySchema), auditLog('create', 'electricity_data'), ctrl.create);
router.put('/:id', authorize('Admin', 'Manager'), validate(electricitySchema), auditLog('update', 'electricity_data'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('delete', 'electricity_data'), ctrl.remove);

module.exports = router;
