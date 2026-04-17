import pool from '../config/db.js';

// Helper to convert empty strings to null for int/date columns
const sanitizeEmpty = (val) => (val === '' ? null : val);

// Get all buses from database
export const getAllBuses = async () => {
    try {
        const result = await pool.query(`
            SELECT b.*, r.route_name 
            FROM buses b 
            LEFT JOIN routes r ON b.route_id = r.route_id
            ORDER BY b.created_at DESC
        `);
        return result.rows;
    } catch (error) {
        console.error("Error in getAllBuses query:", error.message);
        throw error;
    }
};

// Check if bus exists by RC Plate Number
export const getBusByRcPlate = async (rcPlate) => {
    const result = await pool.query('SELECT * FROM buses WHERE rc_plate_number = $1', [rcPlate.trim().toUpperCase()]);
    return result.rows[0];
};

// Check for duplicates by bus_no or engine_number (excluding current rc_plate_number)
export const getDuplicateBus = async (bus_no, engine_number, current_rc_plate_number = null) => {
    let query = 'SELECT * FROM buses WHERE (bus_no = $1 OR engine_number = $2)';
    let params = [sanitizeEmpty(bus_no), engine_number?.trim().toUpperCase()];

    if (current_rc_plate_number) {
        query += ' AND rc_plate_number != $3';
        params.push(current_rc_plate_number.trim().toUpperCase());
    }

    const result = await pool.query(query, params);
    return result.rows[0];
};

// Update an existing bus
export const updateBus = async (rc_plate_number, busData) => {
    const { seating_capacity, engine_number, route_id, purchase_date, status, bus_no } = busData;
    const result = await pool.query(`
        UPDATE buses 
        SET seating_capacity = $1, engine_number = $2, route_id = $3, purchase_date = $4, status = $5, bus_no = $6
        WHERE rc_plate_number = $7
        RETURNING *
    `, [
        sanitizeEmpty(seating_capacity), 
        engine_number?.trim().toUpperCase(), 
        sanitizeEmpty(route_id), 
        sanitizeEmpty(purchase_date), 
        status?.toUpperCase() || 'ACTIVE', 
        sanitizeEmpty(bus_no),
        rc_plate_number.trim().toUpperCase()
    ]);
    return result.rows[0];
};

// Delete a bus
export const deleteBus = async (rc_plate_number) => {
    const result = await pool.query('DELETE FROM buses WHERE rc_plate_number = $1 RETURNING *', [rc_plate_number.trim().toUpperCase()]);
    return result.rows[0];
};

// Create a new bus record
export const createBus = async (busData) => {
    const { rc_plate_number, seating_capacity, engine_number, route_id, purchase_date, status, bus_no } = busData;
    const result = await pool.query(`
        INSERT INTO buses (rc_plate_number, seating_capacity, engine_number, route_id, purchase_date, status, bus_no)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [
        rc_plate_number.trim().toUpperCase(), 
        sanitizeEmpty(seating_capacity), 
        engine_number?.trim().toUpperCase(), 
        sanitizeEmpty(route_id), 
        sanitizeEmpty(purchase_date), 
        status?.toUpperCase() || 'ACTIVE',
        sanitizeEmpty(bus_no)
    ]);
    return result.rows[0];
};