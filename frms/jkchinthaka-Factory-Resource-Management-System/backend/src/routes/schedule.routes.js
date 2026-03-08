const router = require('express').Router();
const ctrl = require('../controllers/schedule.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { validate, workScheduleSchema } = require('../middlewares/validate.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', ctrl.getAll);
router.get('/month', ctrl.getMonthSchedule);
router.get('/attendance', ctrl.getAttendanceSummary);
router.get('/:id', ctrl.getById);
router.post('/', authorize('Admin', 'Manager', 'Data Entry'), validate(workScheduleSchema), auditLog('create', 'work_schedule'), ctrl.create);
router.put('/:id', authorize('Admin', 'Manager'), validate(workScheduleSchema), auditLog('update', 'work_schedule'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('delete', 'work_schedule'), ctrl.remove);

module.exports = router;
