const db = require('../models/db');
const bcrypt = require('bcryptjs');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const [countResult] = await db.query('SELECT COUNT(*) as total FROM users');
    const [users] = await db.query(
      `SELECT u.id, u.name, u.email, r.name as role, u.is_active, u.last_login, u.created_at
       FROM users u JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), offset]
    );

    res.json({
      data: users,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
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

const create = async (req, res, next) => {
  try {
    const { name, email, password, role_id } = req.body;
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, role_id || 3]
    );
    res.status(201).json({ id: result.insertId, name, email });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already exists' });
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, email, role_id, is_active } = req.body;
    await db.query(
      'UPDATE users SET name = COALESCE(?, name), email = COALESCE(?, email), role_id = COALESCE(?, role_id), is_active = COALESCE(?, is_active) WHERE id = ?',
      [name, email, role_id, is_active, req.params.id]
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
