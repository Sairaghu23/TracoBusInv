import pool from '../config/db.js';

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

// Update an existing bus
export const updateBus = async (rc_plate_number, busData) => {
    const { seating_capacity, engine_number, route_id, purchase_date, status, bus_no } = busData;
    const result = await pool.query(`
        UPDATE buses 
        SET seating_capacity = $1, engine_number = $2, route_id = $3, purchase_date = $4, status = $5, bus_no = $6
        WHERE rc_plate_number = $7
        RETURNING *
    `, [
        seating_capacity, 
        engine_number?.trim().toUpperCase(), 
        route_id || null, 
        purchase_date, 
        status?.toUpperCase() || 'ACTIVE', 
        bus_no,
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
        seating_capacity, 
        engine_number?.trim().toUpperCase(), 
        route_id || null, 
        purchase_date, 
        status?.toUpperCase() || 'ACTIVE',
        bus_no
    ]);
    return result.rows[0];
};