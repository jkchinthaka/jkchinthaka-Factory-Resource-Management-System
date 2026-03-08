const analyticsService = require('../services/analytics.service');
const { handleDbError, defaultKPIs } = require('../utils/db-fallback');

const getDashboardKPIs = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    let result;
    try {
      result = await analyticsService.getDashboardKPIs(
        year || new Date().getFullYear(),
        month
      );
    } catch (dbErr) {
      result = handleDbError(dbErr, defaultKPIs);
    }
    res.json(result);
  } catch (error) { next(error); }
};

const getAlerts = async (req, res, next) => {
  try {
    let result;
    try {
      result = await analyticsService.getAlerts();
    } catch (dbErr) {
      result = handleDbError(dbErr, []);
    }
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getDashboardKPIs, getAlerts };
