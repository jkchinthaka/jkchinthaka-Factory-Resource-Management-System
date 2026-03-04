const BaseService = require('./base.service');

class UserService extends BaseService {
  constructor() {
    super('users');
  }
}

module.exports = new UserService();
