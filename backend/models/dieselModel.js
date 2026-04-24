import pool from '../config/db.js';

export const dieselModel = {
    // 1. Get fuel rate for a specific date
    getFuelRate: async (date) => {
        const query = 'SELECT * FROM fuel_rates WHERE rate_date = $1';
        const result = await pool.query(query, [date]);
        return result.rows[0];
    },

    // 2. Set/Update fuel rate for a day
    upsertFuelRate: async (date, rate) => {
        const query = `
            INSERT INTO fuel_rates (rate_date, fuel_rate)
            VALUES ($1, $2)
            ON CONFLICT (rate_date) 
            DO UPDATE SET fuel_rate = EXCLUDED.fuel_rate
            RETURNING *;
        `;
        const result = await pool.query(query, [date, rate]);
        return result.rows[0];
    },

    // 3. Check if all buses have odometer readings for a specific date
    checkOdometerStatus: async (date) => {
        // Find buses that DON'T have a reading for this date
        const query = `
            SELECT b.rc_plate_number, b.bus_no 
            FROM buses b
            LEFT JOIN bus_readings r ON b.bus_id = r.bus_id AND r.end_date = $1
            WHERE r.reading_id IS NULL;
        `;
        const result = await pool.query(query, [date]);
        return result.rows; // Returns array of plate numbers missing readings
    },

    // 4. Get base data for Diesel Entry (Buses + Odometer Reading IDs for the date)
    getReadingsForDieselEntry: async (date) => {
        const query = `
            SELECT 
                b.bus_id,
                b.rc_plate_number,
                b.bus_no,
                r.reading_id,
                r.old_reading,
                r.new_reading,
                r.distance,
                d.liters,
                d.diesel_id
            FROM buses b
            JOIN bus_readings r ON b.bus_id = r.bus_id AND r.end_date = $1
            LEFT JOIN diesel_logs d ON r.reading_id = d.reading_id
            ORDER BY b.bus_no ASC;
        `;
        const result = await pool.query(query, [date]);
        return result.rows;
    },

    // 5. Bulk Save Diesel Logs
    addBulkDieselLogs: async (logs) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const insertedLogs = [];
            
            for (const log of logs) {
                const { bus_id, reading_id, rate_id, liters, date } = log;
                
                // Using ON CONFLICT to update if a log already exists for this reading
                const query = `
                    INSERT INTO diesel_logs (bus_id, reading_id, rate_id, liters, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (reading_id) DO UPDATE SET 
                        liters = EXCLUDED.liters,
                        rate_id = EXCLUDED.rate_id
                    RETURNING *;
                `;
                const res = await client.query(query, [bus_id, reading_id, rate_id, liters, date]);
                insertedLogs.push(res.rows[0]);
            }
            
            await client.query('COMMIT');
            return insertedLogs;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    // 6. Get Comprehensive Summary for PDF/Report
    getDieselReport: async (date) => {
        const query = `
            SELECT 
                b.bus_id,
                b.bus_no,
                b.rc_plate_number,
                r.old_reading,
                r.new_reading,
                r.distance,
                d.liters,
                f.fuel_rate as rate,
                (d.liters * f.fuel_rate) as total_amount,
                CASE WHEN d.liters > 0 THEN (r.distance / d.liters) ELSE 0 END as KMPL
            FROM diesel_logs d
            JOIN bus_readings r ON d.reading_id = r.reading_id
            JOIN fuel_rates f ON d.rate_id = f.rate_id
            JOIN buses b ON d.bus_id = b.bus_id
            WHERE d.created_at = $1
            ORDER BY b.bus_no ASC;
        `;
        const result = await pool.query(query, [date]);
        return result.rows;
    },

    // 7. Get Refueling History for a specific bus
    getDieselHistoryByBus: async (rc_plate_number) => {
        const query = `
            SELECT 
                d.diesel_id,
                TO_CHAR(d.created_at, 'YYYY-MM-DD') as refueling_date,
                d.liters,
                f.fuel_rate as rate,
                (d.liters * f.fuel_rate) as total_amount,
                r.old_reading,
                r.new_reading,
                r.distance,
                CASE WHEN d.liters > 0 THEN (r.distance / d.liters) ELSE 0 END as KMPL
            FROM diesel_logs d
            JOIN fuel_rates f ON d.rate_id = f.rate_id
            JOIN bus_readings r ON d.reading_id = r.reading_id
            JOIN buses b ON d.bus_id = b.bus_id
            WHERE b.rc_plate_number = $1
            ORDER BY d.created_at DESC;
        `;
        const result = await pool.query(query, [rc_plate_number.trim().toUpperCase()]);
        return result.rows;
    },

    // 8. Single Diesel Log for a specific bus
    addSingleDieselLog: async (logData) => {
        const { rc_plate_number, liters, rate, refueling_date, KMPL, total_amount } = logData;
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lookup bus
            const busQuery = await client.query('SELECT bus_id FROM buses WHERE rc_plate_number = $1', [rc_plate_number.trim().toUpperCase()]);
            if (busQuery.rows.length === 0) throw new Error('Vehicle not found.');
            const bus_id = busQuery.rows[0].bus_id;

            // Upsert fuel rate
            const rateQuery = await client.query(`
                INSERT INTO fuel_rates (rate_date, fuel_rate)
                VALUES ($1, $2)
                ON CONFLICT (rate_date) DO UPDATE SET fuel_rate = EXCLUDED.fuel_rate
                RETURNING rate_id;
            `, [refueling_date, rate]);
            const rate_id = rateQuery.rows[0].rate_id;

            // Process Odometer Reading: Check if one exists for the date, otherwise throw error
            const existingReadingQuery = await client.query('SELECT reading_id, distance FROM bus_readings WHERE bus_id = $1 AND end_date::DATE = $2::DATE', [bus_id, refueling_date]);
            if (existingReadingQuery.rows.length === 0) {
                throw new Error("No odometer reading recorded for this date. Please log odometer reading first.");
            }
            const reading_id = existingReadingQuery.rows[0].reading_id;
            const distance = existingReadingQuery.rows[0].distance;
            const KMPLVal = parseFloat(KMPL) || (liters && distance ? distance / liters : 0);

            // Insert or Update diesel log
            const dieselQuery = await client.query(`
                INSERT INTO diesel_logs (bus_id, reading_id, rate_id, liters, created_at, kmpl, total_amount)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (reading_id) DO UPDATE SET 
                    liters = EXCLUDED.liters, rate_id = EXCLUDED.rate_id, KMPL = EXCLUDED.KMPL, total_amount = EXCLUDED.total_amount
                RETURNING *;
            `, [bus_id, reading_id, rate_id, liters, refueling_date, KMPLVal, total_amount || (liters * rate)]);

            await client.query('COMMIT');
            return dieselQuery.rows[0];
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
};
