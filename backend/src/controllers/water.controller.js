const waterService = require('../services/water.service');

const getAll = async (req, res, next) => {
  try {
    const result = await waterService.findAll({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort || 'date',
      order: req.query.order,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    });
    res.json(result);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const item = await waterService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Record not found' });
    res.json(item);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body, created_by: req.user.id };
    if (data.column_data) data.column_data = JSON.stringify(data.column_data);
    const result = await waterService.create(data);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const data = { ...req.body };
    if (data.column_data) data.column_data = JSON.stringify(data.column_data);
    const result = await waterService.update(req.params.id, data);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json(result);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await waterService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (error) { next(error); }
};

const getMonthlyTrend = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const result = await waterService.getMonthlyTrend(year);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, getMonthlyTrend };
