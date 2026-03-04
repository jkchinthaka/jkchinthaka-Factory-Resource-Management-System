const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { auditLog } = require('../middlewares/audit.middleware');

router.use(authenticate);

router.get('/', authorize('Admin', 'Manager'), ctrl.getAll);
router.get('/roles', ctrl.getRoles);
router.get('/:id', authorize('Admin', 'Manager'), ctrl.getById);
router.post('/', authorize('Admin'), auditLog('create', 'users'), ctrl.create);
router.put('/:id', authorize('Admin'), auditLog('update', 'users'), ctrl.update);
router.delete('/:id', authorize('Admin'), auditLog('delete', 'users'), ctrl.remove);

module.exports = router;
