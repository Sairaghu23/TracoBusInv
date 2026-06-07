import pool from './src/config/db.js';

const init = async () => {
    try {
        console.log("Starting database reconstruction...");

        // --- TRANSPORT LOGISTICS ---
        
        // 1. Routes
        await pool.query(`
            CREATE TABLE IF NOT EXISTS routes (
                route_id SERIAL PRIMARY KEY,
                route_name VARCHAR(100) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'routes' ready.");

        // 2. Stoppings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stoppings (
                stop_id SERIAL PRIMARY KEY,
                stop_name VARCHAR(100) NOT NULL,
                route_id INT NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'stoppings' ready.");

        // 3. Stopping Fees
        await pool.query(`
            CREATE TABLE IF NOT EXISTS stopping_fees (
                fee_id SERIAL PRIMARY KEY,
                stop_id INT NOT NULL REFERENCES stoppings(stop_id) ON DELETE CASCADE,
                fee DECIMAL(10,2) NOT NULL CHECK (fee > 0),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'stopping_fees' ready.");

        // --- VEHICLE MANAGEMENT ---

        // 4. Buses (REFINED SCHEMA)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS buses (
                bus_id SERIAL PRIMARY KEY,
                rc_plate_number VARCHAR(20) UNIQUE NOT NULL,
                seating_capacity INT NOT NULL,
                engine_number VARCHAR(50) UNIQUE NOT NULL,
                purchase_date DATE NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'REPAIR')),
                route_id INT REFERENCES routes(route_id) ON DELETE SET NULL,
                bus_no VARCHAR(50) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'buses' ready.");

        // 2. Bus Readings
        await pool.query(`
            CREATE TABLE IF NOT EXISTS bus_readings (
                reading_id SERIAL PRIMARY KEY,
                rc_plate_number VARCHAR(20) REFERENCES buses(rc_plate_number) ON DELETE CASCADE,
                start_date DATE,
                end_date DATE,
                old_reading INT,
                new_reading INT,
                distance INT GENERATED ALWAYS AS (new_reading - old_reading) STORED,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'bus_readings' ready.");

        // 3. Spare Stocks
        await pool.query(`
            CREATE TABLE IF NOT EXISTS spare_stocks (
                spare_id SERIAL PRIMARY KEY,
                spare_name VARCHAR(100) UNIQUE NOT NULL,
                quantity INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'spare_stocks' ready.");

        // 4. Spare Purchases
        await pool.query(`
            CREATE TABLE IF NOT EXISTS spare_purchases (
                purchase_id SERIAL PRIMARY KEY,
                spare_id INT REFERENCES spare_stocks(spare_id) ON DELETE CASCADE,
                quantity INT NOT NULL,
                amount NUMERIC(10, 2) NOT NULL,
                vendor VARCHAR(255),
                purchase_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'spare_purchases' ready.");

        // 5. Spare Usage
        await pool.query(`
            CREATE TABLE IF NOT EXISTS spare_usage (
                usage_id SERIAL PRIMARY KEY,
                rc_plate_number VARCHAR(20) REFERENCES buses(rc_plate_number) ON DELETE CASCADE,
                spare_id INT REFERENCES spare_stocks(spare_id) ON DELETE CASCADE,
                amount NUMERIC(10, 2) NOT NULL,
                mechanic VARCHAR(255),
                usage_date DATE DEFAULT CURRENT_DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'spare_usage' ready.");

        // 6. Fuel Rates
        await pool.query(`
            CREATE TABLE IF NOT EXISTS fuel_rates (
                rate_id SERIAL PRIMARY KEY,
                rate_date DATE UNIQUE NOT NULL,
                fuel_rate NUMERIC(10, 2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'fuel_rates' ready.");

        // 7. Diesel Logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS diesel_logs (
                diesel_id SERIAL PRIMARY KEY,
                rc_plate_number VARCHAR(20) REFERENCES buses(rc_plate_number) ON DELETE CASCADE,
                reading_id INT UNIQUE REFERENCES bus_readings(reading_id),
                rate_id INT REFERENCES fuel_rates(rate_id),
                liters NUMERIC(10, 2) NOT NULL,
                created_at DATE NOT NULL,
                created_at_ts TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- Table 'diesel_logs' ready.");

        // Seed some dummy buses if empty
        const busCount = await pool.query("SELECT COUNT(*) FROM buses");
        if (parseInt(busCount.rows[0].count) === 0) {
            await pool.query(`
                INSERT INTO buses (rc_plate_number, seating_capacity, engine_number, purchase_date, status) VALUES 
                ('AP26TD3344', 40, 'ENG-TR01', CURRENT_DATE, 'ACTIVE'),
                ('AP26TD3345', 40, 'ENG-TR02', CURRENT_DATE, 'ACTIVE'),
                ('AP26TD3346', 40, 'ENG-TR03', CURRENT_DATE, 'ACTIVE')
            `);
            console.log("Seeded initial buses.");
        }

        console.log("Database reconstruction completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Database initialization failed:", err);
        process.exit(1);
    }
};

init();
