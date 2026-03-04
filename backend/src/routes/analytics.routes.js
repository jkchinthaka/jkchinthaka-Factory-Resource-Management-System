const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/dashboard', ctrl.getDashboardKPIs);
router.get('/alerts', ctrl.getAlerts);

module.exports = router;
