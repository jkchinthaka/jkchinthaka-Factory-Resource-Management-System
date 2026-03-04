const analyticsService = require('../services/analytics.service');

const getDashboardKPIs = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await analyticsService.getDashboardKPIs(
      year || new Date().getFullYear(),
      month
    );
    res.json(result);
  } catch (error) { next(error); }
};

const getAlerts = async (req, res, next) => {
  try {
    const result = await analyticsService.getAlerts();
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getDashboardKPIs, getAlerts };
