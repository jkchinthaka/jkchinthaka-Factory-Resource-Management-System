const db = require('../models/db');
const bcrypt = require('bcryptjs');
const { handleDbError, emptyPaginatedResponse } = require('../utils/db-fallback');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    let result;
    try {
      const offset = (parseInt(page) - 1) * parseInt(limit);
      
      const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');
      const [users] = await db.query(
        `SELECT u.id, u.name, u.email, r.name as role, u.is_active, u.last_login, u.created_at
         FROM users u JOIN roles r ON u.role_id = r.id
         ORDER BY u.created_at DESC OFFSET ? ROWS FETCH NEXT ? ROWS ONLY`,
        [offset, parseInt(limit)]
      );

      result = {
        data: users,
        pagination: {
          page: parseInt(page), limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / parseInt(limit))
        }
      };
    } catch (dbErr) {
      result = handleDbError(dbErr, emptyPaginatedResponse(parseInt(page), parseInt(limit)));
    }
    res.json(result);
  } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, r.name as role, u.is_active, u.last_login, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.params.id]
    );
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(users[0]);
  } catch (error) { next(error); }
};

const ROLE_MAP = { admin: 1, manager: 2, 'data entry': 3, viewer: 3, operator: 3 };

function resolveRoleId(body) {
  if (body.role_id) return parseInt(body.role_id);
  if (body.role) return ROLE_MAP[body.role.toLowerCase()] || 3;
  return null;
}

const create = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const roleId = resolveRoleId(req.body) || 3;
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?); SELECT SCOPE_IDENTITY() AS insertId',
      [name, email, passwordHash, roleId]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY' || error.number === 2627 || error.number === 2601) return res.status(409).json({ error: 'Email already exists' });
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, email, is_active } = req.body;
    const roleId = resolveRoleId(req.body);
    await db.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role_id = COALESCE(?, role_id), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name, email, roleId, is_active, req.params.id]
    );
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, r.name as role, u.is_active FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`,
      [req.params.id]
    );
    res.json(users[0]);
  } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (error) { next(error); }
};

const getRoles = async (req, res, next) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles');
    res.json(roles);
  } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, remove, getRoles };
