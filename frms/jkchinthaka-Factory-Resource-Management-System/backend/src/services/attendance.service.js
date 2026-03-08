const db = require('../models/db');

class AttendanceService {
  constructor() {
    this.ensureTablePromise = null;
  }

  async ensureTable() {
    if (!this.ensureTablePromise) {
      this.ensureTablePromise = db.query(`
        IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'user_attendance') AND type = N'U')
        CREATE TABLE user_attendance (
          id INT IDENTITY(1,1) PRIMARY KEY,
          attendance_date DATE NOT NULL,
          user_id INT NOT NULL,
          status NVARCHAR(16) NOT NULL DEFAULT 'deactive',
          notes NVARCHAR(255) NULL,
          marked_by INT NULL,
          marked_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT CK_ua_status CHECK (status IN ('active', 'deactive')),
          CONSTRAINT UQ_ua_user_date UNIQUE (attendance_date, user_id),
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE NO ACTION
        )
      `).catch((error) => {
        this.ensureTablePromise = null;
        throw error;
      });
    }

    await this.ensureTablePromise;
  }

  async getByDate(attendanceDate) {
    await this.ensureTable();

    const [rows] = await db.query(
      `SELECT
         u.id AS user_id,
         u.name AS user_name,
         u.email AS user_email,
         r.name AS role,
         u.is_active AS user_enabled,
         ua.id,
         ua.attendance_date,
         ua.status,
         ua.notes,
         ua.marked_by,
         ua.marked_at,
         ua.updated_at
       FROM users u
       JOIN roles r ON r.id = u.role_id
       LEFT JOIN user_attendance ua
         ON ua.user_id = u.id AND ua.attendance_date = ?
       WHERE u.is_active = 1
       ORDER BY u.name ASC`,
      [attendanceDate]
    );

    return { date: attendanceDate, data: rows };
  }

  async mark({ attendance_date, user_id, status, notes, marked_by }) {
    await this.ensureTable();

    await db.query(
      `MERGE user_attendance AS target
       USING (SELECT ? AS attendance_date, ? AS user_id) AS source(attendance_date, user_id)
       ON target.attendance_date = source.attendance_date AND target.user_id = source.user_id
       WHEN MATCHED THEN
         UPDATE SET status = ?, notes = ?, marked_by = ?, marked_at = GETDATE(), updated_at = GETDATE()
       WHEN NOT MATCHED THEN
         INSERT (attendance_date, user_id, status, notes, marked_by, marked_at, updated_at)
         VALUES (source.attendance_date, source.user_id, ?, ?, ?, GETDATE(), GETDATE());`,
      [
        attendance_date,
        user_id,
        status,
        notes ?? null,
        marked_by ?? null,
        status,
        notes ?? null,
        marked_by ?? null
      ]
    );

    const [rows] = await db.query(
      `SELECT id, attendance_date, user_id, status, notes, marked_by, marked_at, updated_at
         FROM user_attendance
         WHERE attendance_date = ? AND user_id = ?`,
      [attendance_date, user_id]
    );

    return rows[0] || null;
  }

  async getSummary(attendanceDate) {
    await this.ensureTable();

    const [rows] = await db.query(
      `SELECT
         COUNT(*) AS total_marked,
         SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS total_active,
         SUM(CASE WHEN status = 'deactive' THEN 1 ELSE 0 END) AS total_deactive
       FROM user_attendance
       WHERE attendance_date = ?`,
      [attendanceDate]
    );

    return {
      date: attendanceDate,
      total_marked: rows[0]?.total_marked || 0,
      total_active: rows[0]?.total_active || 0,
      total_deactive: rows[0]?.total_deactive || 0
    };
  }
}

module.exports = new AttendanceService();
