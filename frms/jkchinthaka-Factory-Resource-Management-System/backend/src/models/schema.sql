-- FUPMS Database Schema (SQL Server / T-SQL)
-- Factory Utility & Production Management System
-- All statements are idempotent (IF NOT EXISTS guards).

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'roles') AND type = N'U')
CREATE TABLE roles (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(50) NOT NULL UNIQUE,
  description NVARCHAR(255),
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'users') AND type = N'U')
CREATE TABLE users (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  email NVARCHAR(150) NOT NULL UNIQUE,
  password_hash NVARCHAR(255) NOT NULL,
  role_id INT NOT NULL DEFAULT 3,
  is_active BIT DEFAULT 1,
  last_login DATETIME2 NULL,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'assets') AND type = N'U')
CREATE TABLE assets (
  id INT IDENTITY(1,1) PRIMARY KEY,
  name NVARCHAR(100) NOT NULL,
  type NVARCHAR(50) NOT NULL,
  location NVARCHAR(150),
  description NVARCHAR(MAX),
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'electricity_data') AND type = N'U')
CREATE TABLE electricity_data (
  id INT IDENTITY(1,1) PRIMARY KEY,
  date DATE NOT NULL,
  energy_kWh DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  peak_kW DECIMAL(10,2),
  off_peak_kWh DECIMAL(12,2),
  asset_id INT NOT NULL,
  notes NVARCHAR(MAX),
  created_by INT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'water_meter_data') AND type = N'U')
CREATE TABLE water_meter_data (
  id INT IDENTITY(1,1) PRIMARY KEY,
  date DATE NOT NULL,
  intake DECIMAL(12,2) NOT NULL,
  [PPU 1 Reading] DECIMAL(12,2),
  [PPU 2 Reading] DECIMAL(12,2),
  [FPU 1 Reading] DECIMAL(12,2),
  [FPU 2 Reading] DECIMAL(12,2),
  [Chiller Reading] DECIMAL(12,2),
  [Cooling tower Reading] DECIMAL(12,2),
  [Column 1] DECIMAL(12,2),
  [Column 2] DECIMAL(12,2),
  [Column 3] DECIMAL(12,2),
  cost DECIMAL(12,2),
  notes NVARCHAR(MAX),
  created_by INT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'work_schedule') AND type = N'U')
CREATE TABLE work_schedule (
  id INT IDENTITY(1,1) PRIMARY KEY,
  day DATE NOT NULL,
  is_holiday BIT DEFAULT 0,
  holiday_name NVARCHAR(100),
  ppu_planned INT DEFAULT 0,
  ppu_actual INT DEFAULT 0,
  fpu_planned INT DEFAULT 0,
  fpu_actual INT DEFAULT 0,
  fmu_planned INT DEFAULT 0,
  fmu_actual INT DEFAULT 0,
  notes NVARCHAR(MAX),
  created_by INT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'production_target_new') AND type = N'U')
CREATE TABLE production_target_new (
  id INT IDENTITY(1,1) PRIMARY KEY,
  line_id NVARCHAR(50) NOT NULL,
  product_group NVARCHAR(100) NOT NULL,
  production_unit NVARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  target DECIMAL(12,2) NOT NULL,
  actual DECIMAL(12,2) DEFAULT 0,
  efficiency AS (CASE WHEN target > 0 THEN ROUND(actual * 100.0 / target, 2) ELSE 0 END) PERSISTED,
  notes NVARCHAR(MAX),
  created_by INT,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'audit_log') AND type = N'U')
CREATE TABLE audit_log (
  id INT IDENTITY(1,1) PRIMARY KEY,
  user_id INT,
  action NVARCHAR(50) NOT NULL,
  entity NVARCHAR(50) NOT NULL,
  entity_id INT,
  old_values NVARCHAR(MAX),
  new_values NVARCHAR(MAX),
  ip_address NVARCHAR(45),
  created_at DATETIME2 DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'alert_thresholds') AND type = N'U')
CREATE TABLE alert_thresholds (
  id INT IDENTITY(1,1) PRIMARY KEY,
  metric NVARCHAR(50) NOT NULL UNIQUE,
  warning_threshold DECIMAL(12,2),
  critical_threshold DECIMAL(12,2),
  is_active BIT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETDATE(),
  updated_at DATETIME2 DEFAULT GETDATE()
);

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
  CONSTRAINT CK_user_attendance_status CHECK (status IN ('active', 'deactive')),
  CONSTRAINT UQ_user_attendance_user_date UNIQUE (attendance_date, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE NO ACTION
);

-- Indexes (guarded by name check)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_electricity_date' AND object_id = OBJECT_ID('electricity_data'))
  CREATE INDEX idx_electricity_date ON electricity_data(date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_electricity_asset' AND object_id = OBJECT_ID('electricity_data'))
  CREATE INDEX idx_electricity_asset ON electricity_data(asset_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_water_date' AND object_id = OBJECT_ID('water_meter_data'))
  CREATE INDEX idx_water_date ON water_meter_data(date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_schedule_day' AND object_id = OBJECT_ID('work_schedule'))
  CREATE INDEX idx_schedule_day ON work_schedule(day);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_production_date' AND object_id = OBJECT_ID('production_target_new'))
  CREATE INDEX idx_production_date ON production_target_new(date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_production_line' AND object_id = OBJECT_ID('production_target_new'))
  CREATE INDEX idx_production_line ON production_target_new(line_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_user' AND object_id = OBJECT_ID('audit_log'))
  CREATE INDEX idx_audit_user ON audit_log(user_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_entity' AND object_id = OBJECT_ID('audit_log'))
  CREATE INDEX idx_audit_entity ON audit_log(entity, entity_id);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_audit_created' AND object_id = OBJECT_ID('audit_log'))
  CREATE INDEX idx_audit_created ON audit_log(created_at);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_attendance_date' AND object_id = OBJECT_ID('user_attendance'))
  CREATE INDEX idx_user_attendance_date ON user_attendance(attendance_date);
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_user_attendance_user' AND object_id = OBJECT_ID('user_attendance'))
  CREATE INDEX idx_user_attendance_user ON user_attendance(user_id);

-- Seed roles
MERGE roles AS target
USING (VALUES ('Admin', 'Full system access'), ('Manager', 'View and manage data'), ('Data Entry', 'Enter and edit data only'))
  AS source(name, description)
ON target.name = source.name
WHEN NOT MATCHED THEN INSERT (name, description) VALUES (source.name, source.description);

-- Seed default admin user (password: Admin@123)
IF NOT EXISTS (SELECT * FROM users WHERE email = 'admin@fupms.com')
  INSERT INTO users (name, email, password_hash, role_id)
  VALUES ('System Admin', 'admin@fupms.com', '$2a$10$ZJ3aBAvb24umIRrz2JIuFetiNRlmQA32cb1L7aqt19xrYEDinmGCK', 1);

-- Seed alert thresholds
MERGE alert_thresholds AS target
USING (VALUES
  ('electricity_daily_kWh', 10000, 15000),
  ('water_daily_intake', 500, 800),
  ('production_efficiency', 80, 60))
  AS source(metric, warning, critical)
ON target.metric = source.metric
WHEN NOT MATCHED THEN INSERT (metric, warning_threshold, critical_threshold) VALUES (source.metric, source.warning, source.critical)
WHEN MATCHED THEN UPDATE SET warning_threshold = source.warning, critical_threshold = source.critical;