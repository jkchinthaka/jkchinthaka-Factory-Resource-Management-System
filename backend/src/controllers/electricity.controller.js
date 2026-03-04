const electricityService = require('../services/electricity.service');

const getAll = async (req, res, next) => {
  try {
    const result = await electricityService.findAllWithAsset({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort,
      order: req.query.order,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      asset_id: req.query.asset_id
    });
    res.json(result);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const item = await electricityService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Record not found' });
    res.json(item);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body, created_by: req.user.id };
    const result = await electricityService.create(data);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const result = await electricityService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json(result);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await electricityService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (error) { next(error); }
};

const getMonthlyTrend = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const result = await electricityService.getMonthlyTrend(year);
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, getMonthlyTrend };
