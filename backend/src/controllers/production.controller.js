const productionService = require('../services/production.service');

const getAll = async (req, res, next) => {
  try {
    const result = await productionService.findAllWithDetails({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort: req.query.sort,
      order: req.query.order,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      line_id: req.query.line_id,
      product_group: req.query.product_group
    });
    res.json(result);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const item = await productionService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Record not found' });
    res.json(item);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const data = { ...req.body, created_by: req.user.id };
    const result = await productionService.create(data);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const result = await productionService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json(result);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await productionService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Record not found' });
    res.json({ message: 'Record deleted' });
  } catch (error) { next(error); }
};

const getMonthlyAchievement = async (req, res, next) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const result = await productionService.getMonthlyAchievement(year);
    res.json(result);
  } catch (error) { next(error); }
};

const getLinePerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const result = await productionService.getLinePerformance(
      startDate || '2025-01-01',
      endDate || '2025-12-31'
    );
    res.json(result);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, getMonthlyAchievement, getLinePerformance };
