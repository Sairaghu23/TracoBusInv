import pool from './src/config/db.js';

const migrate = async () => {
    try {
        console.log("Starting refined buses migration...");

        // 1. Drop dependent foreign keys temporarily
        await pool.query("ALTER TABLE IF EXISTS bus_readings DROP CONSTRAINT IF EXISTS bus_readings_rc_plate_number_fkey");
        await pool.query("ALTER TABLE IF EXISTS spare_usage DROP CONSTRAINT IF EXISTS spare_usage_rc_plate_number_fkey");
        await pool.query("ALTER TABLE IF EXISTS diesel_logs DROP CONSTRAINT IF EXISTS diesel_logs_rc_plate_number_fkey");
        console.log("- Temporarily removed foreign key constraints.");

        // 2. Drop and Recreate Buses Table (using user's specific schema + route_id)
        await pool.query("DROP TABLE IF EXISTS buses CASCADE");
        await pool.query(`
            CREATE TABLE buses (
                bus_id SERIAL PRIMARY KEY,
                rc_plate_number VARCHAR(20) UNIQUE NOT NULL,
                seating_capacity INT NOT NULL,
                engine_number VARCHAR(50) UNIQUE NOT NULL,
                purchase_date DATE NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REPAIR')),
                route_id INT REFERENCES routes(route_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Created refined 'buses' table.");

        // 3. Re-add foreign key constraints
        await pool.query(`
            ALTER TABLE bus_readings 
            ADD CONSTRAINT bus_readings_rc_plate_number_fkey 
            FOREIGN KEY (rc_plate_number) REFERENCES buses(rc_plate_number) ON DELETE CASCADE
        `);
        await pool.query(`
            ALTER TABLE spare_usage 
            ADD CONSTRAINT spare_usage_rc_plate_number_fkey 
            FOREIGN KEY (rc_plate_number) REFERENCES buses(rc_plate_number) ON DELETE CASCADE
        `);
        await pool.query(`
            ALTER TABLE diesel_logs 
            ADD CONSTRAINT diesel_logs_rc_plate_number_fkey 
            FOREIGN KEY (rc_plate_number) REFERENCES buses(rc_plate_number) ON DELETE CASCADE
        `);
        console.log("- Re-established foreign key relationships using UNIQUE constraint.");

        // 4. Seed initial data
        await pool.query(`
            INSERT INTO buses (rc_plate_number, seating_capacity, engine_number, purchase_date) VALUES 
            ('AP26TD3344', 40, 'ENG-TR01', CURRENT_DATE),
            ('AP26TD3345', 40, 'ENG-TR02', CURRENT_DATE),
            ('AP26TD3346', 40, 'ENG-TR03', CURRENT_DATE)
        `);
        console.log("- Seeded initial buses.");

        console.log("Migration completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
