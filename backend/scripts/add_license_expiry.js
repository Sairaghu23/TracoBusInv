import pool from './src/config/db.js';

const migrate = async () => {
    try {
        // Add license_expiry column to drivers table if it doesn't exist
        await pool.query(`
            ALTER TABLE drivers 
            ADD COLUMN IF NOT EXISTS license_expiry DATE
        `);
        console.log("✅ Added 'license_expiry' column to 'drivers' table.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Migration failed:", err.message);
        process.exit(1);
    }
};

migrate();
