import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log("Running migration: (Re)creating drivers table...");

        // Drop existing to ensure schema consistency for new module (Count was 0)
        await pool.query(`DROP TABLE IF EXISTS drivers CASCADE`);

        await pool.query(`
            CREATE TABLE drivers (
                driver_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                license_number VARCHAR(50) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
                joining_date DATE DEFAULT CURRENT_DATE,
                address TEXT,
                photo_url VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log("- Table 'drivers' created successfully.");

        // Seed a sample driver
        await pool.query(`
            INSERT INTO drivers (name, phone, license_number, status, address) VALUES 
            ('Rajesh Kumar', '9876543210', 'DL-TS01-2024', 'ACTIVE', 'H.No 12-3, Main Road, Hyderabad'),
            ('Suresh Goud', '8877665544', 'DL-TS02-2024', 'INACTIVE', 'Plot 44, Jubilee Hills, Hyderabad')
        `);
        console.log("Seeded initial drivers.");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
function poolEnd() {
    pool.end().catch(err => console.error("Error closing pool:", err));
}
process.on('exit', poolEnd);
