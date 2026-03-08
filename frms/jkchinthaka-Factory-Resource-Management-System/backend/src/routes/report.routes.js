const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);
router.use(authorize('Admin', 'Manager'));

router.get('/electricity', ctrl.generateElectricityReport);
router.get('/water', ctrl.generateWaterReport);
router.get('/production', ctrl.generateProductionReport);
router.get('/schedule', ctrl.generateScheduleReport);

module.exports = router;
