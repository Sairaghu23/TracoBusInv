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
    },

    // 4. Get base data for Diesel Entry (Buses + Odometer Reading IDs for the date)
    getReadingsForDieselEntry: async (date) => {
        const query = `
            SELECT 
                b.bus_id,
                b.rc_plate_number,
                b.bus_no,
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
                const { rc_plate_number, reading_id, rate_id, liters, date } = log;
                
                // Using ON CONFLICT to update if a log already exists for this reading
                const query = `
                    INSERT INTO diesel_logs (rc_plate_number, reading_id, rate_id, liters, created_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (reading_id) DO UPDATE SET 
                        liters = EXCLUDED.liters,
                        rate_id = EXCLUDED.rate_id
                    RETURNING *;
                `;
                const res = await client.query(query, [
                    rc_plate_number ? String(rc_plate_number).trim().toUpperCase() : '',
                    reading_id,
                    rate_id,
                    liters,
                    date
                ]);
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
            JOIN buses b ON d.rc_plate_number = b.rc_plate_number
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
            JOIN buses b ON d.rc_plate_number = b.rc_plate_number
            WHERE b.rc_plate_number = $1
            ORDER BY d.created_at DESC;
        `;
        const result = await pool.query(query, [rc_plate_number ? String(rc_plate_number).trim().toUpperCase() : '']);
        return result.rows;
    }
};
