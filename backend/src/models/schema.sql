-- FUPMS Database Schema
-- Factory Utility & Production Management System

CREATE DATABASE IF NOT EXISTS fupms;
USE fupms;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role_id INT NOT NULL DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  location VARCHAR(150),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Electricity data
CREATE TABLE IF NOT EXISTS electricity_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  energy_kWh DECIMAL(12,2) NOT NULL,
  cost DECIMAL(12,2) NOT NULL,
  peak_kW DECIMAL(10,2),
  off_peak_kWh DECIMAL(12,2),
  asset_id INT NOT NULL,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_electricity_date (date),
  INDEX idx_electricity_asset (asset_id)
);

-- Water meter data
CREATE TABLE IF NOT EXISTS water_meter_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATE NOT NULL,
  intake DECIMAL(12,2) NOT NULL,
  ppu_reading DECIMAL(12,2),
  fpu_reading DECIMAL(12,2),
  chiller DECIMAL(12,2),
  cooling_tower DECIMAL(12,2),
  column_data JSON,
  cost DECIMAL(12,2),
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_water_date (date)
);

-- Work schedule
CREATE TABLE IF NOT EXISTS work_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day DATE NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  holiday_name VARCHAR(100),
  ppu_planned INT DEFAULT 0,
  ppu_actual INT DEFAULT 0,
  fpu_planned INT DEFAULT 0,
  fpu_actual INT DEFAULT 0,
  fmu_planned INT DEFAULT 0,
  fmu_actual INT DEFAULT 0,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_schedule_day (day)
);

-- Production target
CREATE TABLE IF NOT EXISTS production_target_new (
  id INT AUTO_INCREMENT PRIMARY KEY,
  line_id VARCHAR(50) NOT NULL,
  product_group VARCHAR(100) NOT NULL,
  production_unit VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  target DECIMAL(12,2) NOT NULL,
  actual DECIMAL(12,2) DEFAULT 0,
  efficiency DECIMAL(5,2) GENERATED ALWAYS AS (CASE WHEN target > 0 THEN (actual / target) * 100 ELSE 0 END) STORED,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_production_date (date),
  INDEX idx_production_line (line_id)
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(50) NOT NULL,
  entity_id INT,
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_entity (entity, entity_id),
  INDEX idx_audit_created (created_at)
);

-- Alert thresholds
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  metric VARCHAR(50) NOT NULL UNIQUE,
  warning_threshold DECIMAL(12,2),
  critical_threshold DECIMAL(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed roles
INSERT INTO roles (name, description) VALUES
  ('Admin', 'Full system access'),
  ('Manager', 'View and manage data'),
  ('Data Entry', 'Enter and edit data only')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Seed default admin user (password: Admin@123)
INSERT INTO users (name, email, password_hash, role_id) VALUES
  ('System Admin', 'admin@fupms.com', '$2a$10$XQxBj1NAqYbqVmWmhM7KOeKYjYME3MjGLCMGkSbOHGc8MQ8KdKawi', 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Seed alert thresholds
INSERT INTO alert_thresholds (metric, warning_threshold, critical_threshold) VALUES
  ('electricity_daily_kWh', 10000, 15000),
  ('water_daily_intake', 500, 800),
  ('production_efficiency', 80, 60)
ON DUPLICATE KEY UPDATE metric = VALUES(metric);
