const BaseService = require('./base.service');
const db = require('../models/db');

class ScheduleService extends BaseService {
  constructor() {
    super('work_schedule');
  }

  async getMonthSchedule(year, month) {
    const [rows] = await db.query(
      `SELECT * FROM work_schedule WHERE YEAR(day) = ? AND MONTH(day) = ? ORDER BY day`,
      [year, month]
    );
    return rows;
  }

  async getAttendanceSummary(year, month) {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN is_holiday = 1 THEN 1 ELSE 0 END) as holidays,
        SUM(ppu_planned) as total_ppu_planned,
        SUM(ppu_actual) as total_ppu_actual,
        SUM(fpu_planned) as total_fpu_planned,
        SUM(fpu_actual) as total_fpu_actual,
        SUM(fmu_planned) as total_fmu_planned,
        SUM(fmu_actual) as total_fmu_actual
       FROM work_schedule WHERE YEAR(day) = ? AND MONTH(day) = ?`,
      [year, month]
    );
    return rows[0];
  }

  async getHolidays(year) {
    const [rows] = await db.query(
      `SELECT * FROM work_schedule WHERE YEAR(day) = ? AND is_holiday = 1 ORDER BY day`,
      [year]
    );
    return rows;
  }
}

module.exports = new ScheduleService();
