import pool from './src/config/db.js';
import { execSync } from 'child_process';

const reset = async () => {
    try {
        console.log("Dropping all tables to ensure clean refined schema...");
        await pool.query(`
            DROP TABLE IF EXISTS diesel_logs CASCADE;
            DROP TABLE IF EXISTS bus_readings CASCADE;
            DROP TABLE IF EXISTS spare_usage CASCADE;
            DROP TABLE IF EXISTS spare_purchases CASCADE;
            DROP TABLE IF EXISTS spare_stocks CASCADE;
            DROP TABLE IF EXISTS stopping_fees CASCADE;
            DROP TABLE IF EXISTS stoppings CASCADE;
            DROP TABLE IF EXISTS routes CASCADE;
            DROP TABLE IF EXISTS buses CASCADE;
            DROP TABLE IF EXISTS fuel_rates CASCADE;
        `);
        console.log("All tables dropped.");
        
        console.log("Running init_db.js...");
        execSync('node init_db.js', { stdio: 'inherit' });
        
        console.log("Database reset and re-initialized successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Reset failed:", err);
        process.exit(1);
    }
};

reset();
