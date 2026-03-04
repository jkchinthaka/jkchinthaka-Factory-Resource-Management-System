const scheduleService = require('../services/schedule.service');

const getAll = async (req, res, next) => {
  try {
    const result = await scheduleService.findAll({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 31,
      sort: req.query.sort || 'day',
      order: req.query.order || 'asc',
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    res.json(result);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const item = await scheduleService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Record not found' });
    res.json(item);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body, created_by: req.user.id };
    const result = await scheduleService.create(data);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const result = await scheduleService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json(result);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await scheduleService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (error) { next(error); }
};

const getMonthSchedule = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await scheduleService.getMonthSchedule(
      year || new Date().getFullYear(),
      month || new Date().getMonth() + 1
    );
    res.json(result);
  } catch (error) { next(error); }
};

const getAttendanceSummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const result = await scheduleService.getAttendanceSummary(
      year || new Date().getFullYear(),
      month || new Date().getMonth() + 1
    );
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, getMonthSchedule, getAttendanceSummary };
