const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate, loginSchema, registerSchema } = require('../middlewares/validate.middleware');

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/register', authenticate, validate(registerSchema), ctrl.register);
router.get('/profile', authenticate, ctrl.getProfile);
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
