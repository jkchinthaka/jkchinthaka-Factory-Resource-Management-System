const db = require('../models/db');
const logger = require('../utils/logger');

const auditLog = (action, entity) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      try {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await db.query(
            `INSERT INTO audit_log (user_id, action, entity, entity_id, new_values, ip_address)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              req.user?.id || null,
              action,
              entity,
              data?.id || data?.data?.id || null,
              JSON.stringify(req.body || {}),
              req.ip
            ]
          );
        }
      } catch (error) {
        logger.error(`Audit log failed: ${error.message}`);
      }
      return originalJson(data);
    };
    next();
  };
};

module.exports = { auditLog };
