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

<<<<<<< HEAD
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
=======
    checkOdometerStatus: async (date) => {
        // Returns buses that don't have ANY reading history on or before this date
        const query = `
            SELECT b.rc_plate_number, b.bus_no 
            FROM buses b
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id) bus_id, reading_id 
                FROM bus_readings 
                WHERE end_date <= $1
                ORDER BY bus_id, end_date DESC
            ) r ON b.bus_id = r.bus_id
            WHERE r.reading_id IS NULL;
        `;
        const result = await pool.query(query, [date]);
        return result.rows; // Returns array of plate numbers missing ANY readings
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
    },

    // 4. Get base data for Diesel Entry (Buses + Odometer Reading IDs for the date)
    getReadingsForDieselEntry: async (date) => {
        const query = `
            SELECT 
                b.bus_id,
                b.rc_plate_number,
                b.bus_no,
<<<<<<< HEAD
                r.reading_id,
                r.old_reading,
                r.new_reading,
                r.distance,
                d.liters,
                d.diesel_id
            FROM buses b
            JOIN bus_readings r ON b.bus_id = r.bus_id AND r.end_date = $1
            LEFT JOIN diesel_logs d ON r.reading_id = d.reading_id
=======
                COALESCE(r.reading_id, lr.reading_id) as reading_id,
                COALESCE(r.old_reading, lr.old_reading) as old_reading,
                COALESCE(r.new_reading, lr.new_reading) as new_reading,
                COALESCE(r.distance, lr.distance, 0) as distance,
                d.liters,
                d.diesel_id,
                (r.reading_id IS NOT NULL) as exact_match
            FROM buses b
            LEFT JOIN bus_readings r ON b.bus_id = r.bus_id AND r.end_date = $1
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id) bus_id, reading_id, old_reading, new_reading, distance
                FROM bus_readings
                WHERE end_date < $1
                ORDER BY bus_id, end_date DESC, reading_id DESC
            ) lr ON b.bus_id = lr.bus_id
            LEFT JOIN diesel_logs d ON COALESCE(r.reading_id, lr.reading_id) = d.reading_id
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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
<<<<<<< HEAD
                const { bus_id, reading_id, rate_id, liters, date } = log;
                
                // Using ON CONFLICT to update if a log already exists for this reading
                const query = `
                    INSERT INTO diesel_logs (bus_id, reading_id, rate_id, liters, created_at)
=======
                const { rc_plate_number, reading_id, rate_id, liters, date } = log;
                
                // Using ON CONFLICT to update if a log already exists for this reading
                const query = `
                    INSERT INTO diesel_logs (rc_plate_number, reading_id, rate_id, liters, created_at)
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (reading_id) DO UPDATE SET 
                        liters = EXCLUDED.liters,
                        rate_id = EXCLUDED.rate_id
                    RETURNING *;
                `;
<<<<<<< HEAD
                const res = await client.query(query, [bus_id, reading_id, rate_id, liters, date]);
=======
                const res = await client.query(query, [
                    rc_plate_number ? String(rc_plate_number).trim().toUpperCase() : '',
                    reading_id,
                    rate_id,
                    liters,
                    date
                ]);
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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
<<<<<<< HEAD
            JOIN buses b ON d.bus_id = b.bus_id
=======
            JOIN buses b ON d.rc_plate_number = b.rc_plate_number
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
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
<<<<<<< HEAD
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
=======
            JOIN buses b ON d.rc_plate_number = b.rc_plate_number
            WHERE b.rc_plate_number = $1
            ORDER BY d.created_at DESC;
        `;
        const result = await pool.query(query, [rc_plate_number ? String(rc_plate_number).trim().toUpperCase() : '']);
        return result.rows;
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
    }
};
