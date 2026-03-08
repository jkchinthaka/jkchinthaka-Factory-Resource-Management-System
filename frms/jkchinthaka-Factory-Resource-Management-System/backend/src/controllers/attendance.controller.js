const attendanceService = require('../services/attendance.service');
const { handleDbError } = require('../utils/db-fallback');

function defaultDate() {
  return new Date().toISOString().split('T')[0];
}

const ADMIN_ROLES = ['Admin', 'Manager'];

const getByDate = async (req, res, next) => {
  try {
    const attendanceDate = req.query.date || defaultDate();
    const scopeUserId = ADMIN_ROLES.includes(req.user?.role) ? null : req.user?.id;
    let result;
    try {
      result = await attendanceService.getByDate(attendanceDate, scopeUserId);
    } catch (dbErr) {
      result = handleDbError(dbErr, { date: attendanceDate, data: [] });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const mark = async (req, res, next) => {
  try {
    const payload = {
      attendance_date: req.body.attendance_date,
      user_id: req.body.user_id,
      status: req.body.status,
      notes: req.body.notes,
      marked_by: req.user?.id
    };

    // Non-admin/manager users may only mark their own attendance
    if (!ADMIN_ROLES.includes(req.user?.role) && parseInt(payload.user_id) !== req.user?.id) {
      return res.status(403).json({ error: 'You can only mark your own attendance.' });
    }

    const result = await attendanceService.mark(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const attendanceDate = req.query.date || defaultDate();
    const scopeUserId = ADMIN_ROLES.includes(req.user?.role) ? null : req.user?.id;
    let result;
    try {
      result = await attendanceService.getSummary(attendanceDate, scopeUserId);
    } catch (dbErr) {
      result = handleDbError(dbErr, {
        date: attendanceDate,
        total_marked: 0,
        total_active: 0,
        total_deactive: 0
      });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getByDate, mark, getSummary };
