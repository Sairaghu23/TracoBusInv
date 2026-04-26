import pool from '../config/db.js';

const migrate = async () => {
    try {
        console.log("Starting DB Migration/Sync...");

        // 1. Alter oil_logs
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='oil_logs' AND column_name='old_reading') THEN
                    ALTER TABLE oil_logs ADD COLUMN old_reading INT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='oil_logs' AND column_name='new_reading') THEN
                    ALTER TABLE oil_logs ADD COLUMN new_reading INT;
                END IF;
            END $$;
        `);
        console.log("- oil_logs updated with odometer columns.");

        // 2. Alter spare_usage
        await pool.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spare_usage' AND column_name='old_reading') THEN
                    ALTER TABLE spare_usage ADD COLUMN old_reading INT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spare_usage' AND column_name='new_reading') THEN
                    ALTER TABLE spare_usage ADD COLUMN new_reading INT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spare_usage' AND column_name='labor_charges') THEN
                    ALTER TABLE spare_usage ADD COLUMN labor_charges NUMERIC(10, 2) DEFAULT 0;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='spare_usage' AND column_name='parts_cost') THEN
                    ALTER TABLE spare_usage ADD COLUMN parts_cost NUMERIC(10, 2) DEFAULT 0;
                END IF;
            END $$;
        `);
        console.log("- spare_usage updated with odometer and cost columns.");

        // 3. Create spare_inventory
        await pool.query(`
            CREATE TABLE IF NOT EXISTS spare_inventory (
                item_id SERIAL PRIMARY KEY,
                spare_id INT REFERENCES spare_stocks(spare_id) ON DELETE CASCADE,
                purchase_id INT REFERENCES spare_purchases(purchase_id) ON DELETE CASCADE,
                product_code VARCHAR(100) UNIQUE NOT NULL,
                status VARCHAR(20) DEFAULT 'AVAILABLE',
                usage_id INT REFERENCES spare_usage(usage_id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("- spare_inventory table ready.");

        // 4. Add distance column to spare_usage and oil_logs if needed
        // Actually we can calculate it on frontend as requested, but having it as a generated column is also neat.
        // The user specifically asked to "display a distance column that is the difference between the old reading and the new reading" 
        // so I will compute it in my queries or on frontend.

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
};

migrate();
