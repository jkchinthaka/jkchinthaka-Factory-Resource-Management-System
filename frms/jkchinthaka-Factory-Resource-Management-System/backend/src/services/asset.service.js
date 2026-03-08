const BaseService = require('./base.service');

class AssetService extends BaseService {
  constructor() {
    super('assets');
  }
}

module.exports = new AssetService();
