const BaseService = require('./base.service');
const db = require('../models/db');

class WaterService extends BaseService {
  constructor() {
    super('water_meter_data');
  }

  async getMonthlyTrend(year) {
    const [rows] = await db.query(
      `SELECT MONTH(date) as month, SUM(intake) as total_intake,
              AVG(intake) as avg_intake, SUM(cost) as total_cost, COUNT(*) as readings
       FROM water_meter_data
       WHERE YEAR(date) = ?
       GROUP BY MONTH(date)
       ORDER BY month`,
      [year]
    );
    return rows;
  }

  async getDailySummary(startDate, endDate) {
    const [rows] = await db.query(
      `SELECT date, SUM(intake) as total_intake, SUM(ppu_reading) as total_ppu,
              SUM(fpu_reading) as total_fpu, SUM(chiller) as total_chiller,
              SUM(cooling_tower) as total_cooling
       FROM water_meter_data
       WHERE date BETWEEN ? AND ?
       GROUP BY date ORDER BY date`,
      [startDate, endDate]
    );
    return rows;
  }
}

module.exports = new WaterService();
