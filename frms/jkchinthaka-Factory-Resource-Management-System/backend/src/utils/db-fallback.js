const logger = require('./logger');

function isDbConnectionError(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('failed to connect') || msg.includes('econnrefused') || msg.includes('timeout') || msg.includes('login failed') || msg.includes('not connected');
}

function emptyPaginatedResponse(page = 1, limit = 20) {
  return {
    data: [],
    pagination: { page, limit, total: 0, totalPages: 0 }
  };
}

const defaultKPIs = {
  electricity: { total_kWh: 0, total_cost: 0 },
  water: { total_intake: 0, total_cost: 0 },
  production: { total_target: 0, total_actual: 0, achievement_pct: 0 },
  attendance: { total_days: 0, holidays: 0, attendance_pct: 0 },
  kpi: { cost_per_unit: 0, energy_per_unit: 0, water_per_unit: 0 }
};

function handleDbError(error, fallbackData = null) {
  if (!isDbConnectionError(error)) throw error;
  logger.warn(`DB unavailable, returning fallback data: ${error.message}`);
  return fallbackData;
}

module.exports = { isDbConnectionError, emptyPaginatedResponse, defaultKPIs, handleDbError };
