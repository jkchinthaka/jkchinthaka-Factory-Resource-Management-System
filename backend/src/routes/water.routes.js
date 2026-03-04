const router = require('express').Router();
const ctrl = require('../controllers/water.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, waterMeterSchema } = require('../middlewares/validate.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/trend', ctrl.getMonthlyTrend);
router.get('/:id', ctrl.getById);
router.post('/', authorize('Admin', 'Manager', 'Data Entry'), validate(waterMeterSchema), auditLog('create', 'water_meter_data'), ctrl.create);
router.put('/:id', authorize('Admin', 'Manager'), validate(waterMeterSchema), auditLog('update', 'water_meter_data'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('delete', 'water_meter_data'), ctrl.remove);

module.exports = router;
