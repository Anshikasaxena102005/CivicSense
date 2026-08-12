/**
 * Admin seed script — run once after schema.sql import.
 * Creates the default Super Admin account and sample officers.
 *
 * Usage: npm run seed
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const SALT_ROUNDS = 10;

const seed = async () => {
  console.log('🌱 Starting seed...\n');

  // ── Admin ──────────────────────────────────────────────────
  const adminEmail    = 'admin@civicsense.local';
  const adminPassword = 'Admin@123';

  const [existingAdmin] = await pool.execute(
    'SELECT id FROM users WHERE email = ?', [adminEmail]
  );

  if (existingAdmin.length === 0) {
    const hashed = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Super Admin', adminEmail, hashed, 'admin']
    );
    console.log('✅ Admin created');
    console.log('   📧 Email   :', adminEmail);
    console.log('   🔑 Password:', adminPassword);
  } else {
    console.log('⚠️  Admin already exists — skipped');
  }

  // ── Sample Officers ────────────────────────────────────────
  const officers = [
    { name: 'Raj Kumar',   email: 'raj@civicsense.local',   dept: 1 },
    { name: 'Priya Mehta', email: 'priya@civicsense.local', dept: 2 },
    { name: 'Amit Singh',  email: 'amit@civicsense.local',  dept: 3 },
  ];

  for (const o of officers) {
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [o.email]);
    if (existing.length === 0) {
      const hashed = await bcrypt.hash('Officer@123', SALT_ROUNDS);
      await pool.execute(
        'INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)',
        [o.name, o.email, hashed, 'officer', o.dept]
      );
      console.log(`✅ Officer created: ${o.name} (${o.email})`);
    }
  }

  // ── Sample Citizen ─────────────────────────────────────────
  const [existingCitizen] = await pool.execute(
    'SELECT id FROM users WHERE email = ?', ['citizen@civicsense.local']
  );
  if (existingCitizen.length === 0) {
    const hashed = await bcrypt.hash('Citizen@123', SALT_ROUNDS);
    await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      ['Test Citizen', 'citizen@civicsense.local', hashed, 'citizen']
    );
    console.log('✅ Citizen created: citizen@civicsense.local / Citizen@123');
  }

  console.log('\n🎉 Seed complete!\n');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
