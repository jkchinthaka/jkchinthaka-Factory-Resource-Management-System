const router = require('express').Router();
const ctrl = require('../controllers/production.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, productionTargetSchema } = require('../middlewares/validate.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/achievement', ctrl.getMonthlyAchievement);
router.get('/performance', ctrl.getLinePerformance);
router.get('/:id', ctrl.getById);
router.post('/', authorize('Admin', 'Manager', 'Data Entry'), validate(productionTargetSchema), auditLog('create', 'production_target_new'), ctrl.create);
router.put('/:id', authorize('Admin', 'Manager'), validate(productionTargetSchema), auditLog('update', 'production_target_new'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('delete', 'production_target_new'), ctrl.remove);

module.exports = router;
