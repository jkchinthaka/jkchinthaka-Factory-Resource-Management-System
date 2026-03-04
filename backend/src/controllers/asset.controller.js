const assetService = require('../services/asset.service');

const getAll = async (req, res, next) => {
  try {
    const result = await assetService.findAll({
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sort: req.query.sort || 'name',
      order: req.query.order || 'asc'
    });
    res.json(result);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const item = await assetService.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Asset not found' });
    res.json(item);
  } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try {
    const result = await assetService.create(req.body);
    res.status(201).json(result);
  } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try {
    const result = await assetService.update(req.params.id, req.body);
    if (!result) return res.status(404).json({ error: 'Asset not found' });
    res.json(result);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    const result = await assetService.delete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove };
