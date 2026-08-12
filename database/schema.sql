-- ============================================================
-- CivicSense Database Schema
-- Run this ONCE in your MySQL client before starting the app
-- ============================================================

CREATE DATABASE IF NOT EXISTS civicsense_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE civicsense_db;

-- ============================================================
-- TABLE: departments
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  department_id INT,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  role          ENUM('citizen', 'officer', 'admin') NOT NULL DEFAULT 'citizen',
  phone         VARCHAR(20),
  address       TEXT,
  avatar        VARCHAR(255),
  department_id INT,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: issues
-- ============================================================
CREATE TABLE IF NOT EXISTS issues (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  title            VARCHAR(200) NOT NULL,
  description      TEXT NOT NULL,
  category_id      INT,
  citizen_id       INT NOT NULL,
  officer_id       INT,
  status           ENUM('pending','assigned','in_progress','resolved','rejected','reopened') NOT NULL DEFAULT 'pending',
  priority         ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  location         VARCHAR(255),
  latitude         DECIMAL(10, 8),
  longitude        DECIMAL(11, 8),
  images           JSON,
  after_images     JSON,
  resolution_note  TEXT,
  rejection_reason TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (citizen_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (officer_id)  REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: issue_timeline
-- ============================================================
CREATE TABLE IF NOT EXISTS issue_timeline (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  issue_id   INT NOT NULL,
  user_id    INT,
  action     VARCHAR(100) NOT NULL,
  note       TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  user_id          INT NOT NULL,
  title            VARCHAR(200) NOT NULL,
  message          TEXT NOT NULL,
  type             ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
  is_read          TINYINT(1) NOT NULL DEFAULT 0,
  related_issue_id INT,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)          REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (related_issue_id) REFERENCES issues(id) ON DELETE SET NULL
);

-- ============================================================
-- INDEXES for query performance
-- ============================================================
CREATE INDEX idx_issues_status      ON issues(status);
CREATE INDEX idx_issues_citizen     ON issues(citizen_id);
CREATE INDEX idx_issues_officer     ON issues(officer_id);
CREATE INDEX idx_issues_category    ON issues(category_id);
CREATE INDEX idx_issues_created_at  ON issues(created_at);
CREATE INDEX idx_notif_user         ON notifications(user_id);
CREATE INDEX idx_notif_is_read      ON notifications(is_read);
CREATE INDEX idx_timeline_issue     ON issue_timeline(issue_id);
CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_dept         ON users(department_id);

-- ============================================================
-- SEED: Departments
-- ============================================================
INSERT INTO departments (name, description) VALUES
  ('Public Works',           'Roads, bridges, footpaths, and infrastructure'),
  ('Water & Sanitation',     'Water supply, sewage, and drainage management'),
  ('Electricity Department', 'Power supply, street lights, and electrical maintenance'),
  ('Parks & Recreation',     'Public parks, playgrounds, and green spaces'),
  ('Public Health',          'Sanitation, mosquito control, and health facilities');

-- ============================================================
-- SEED: Categories
-- ============================================================
INSERT INTO categories (name, description, department_id) VALUES
  ('Pothole',           'Road damage and potholes requiring repair',          1),
  ('Road Damage',       'General road surface cracks and damage',             1),
  ('Broken Footpath',   'Damaged or missing footpath/sidewalk',               1),
  ('Street Light Out',  'Non-functioning or missing street lights',           3),
  ('Power Outage',      'Electricity supply disruption in an area',           3),
  ('Water Leak',        'Leaking or burst water pipes',                       2),
  ('Sewer Overflow',    'Sewage overflowing or blocked drains',               2),
  ('Garbage Dumping',   'Illegal garbage dumping or missed collection',       2),
  ('Tree Fallen',       'Fallen trees blocking roads or causing hazard',      4),
  ('Park Equipment',    'Broken benches, swings or park equipment',           4),
  ('Mosquito Breeding', 'Stagnant water creating mosquito breeding spots',    5),
  ('Illegal Construction', 'Unauthorised construction or encroachment',       1);
