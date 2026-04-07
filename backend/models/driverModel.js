import pool from '../config/db.js';

// Get all drivers
export const getAllDrivers = async () => {
    try {
        const result = await pool.query('SELECT * FROM drivers ORDER BY created_at DESC');
        return result.rows;
    } catch (error) {
        console.error("Error in getAllDrivers query:", error.message);
        throw error;
    }
};

// Get driver by ID
export const getDriverById = async (id) => {
    try {
        const result = await pool.query('SELECT * FROM drivers WHERE driver_id = $1', [id]);
        return result.rows[0];
    } catch (error) {
        console.error("Error in getDriverById query:", error.message);
        throw error;
    }
};

// Create a new driver record
export const createDriver = async (driverData) => {
    const { name, phone, license_number, status, joining_date, address, photo_url, license_expiry } = driverData;
    try {
        const result = await pool.query(`
            INSERT INTO drivers (name, phone, license_number, status, joining_date, address, photo_url, license_expiry)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            name.trim(), 
            phone.trim(), 
            license_number.trim().toUpperCase(), 
            status?.toUpperCase() || 'ACTIVE', 
            joining_date || new Date(), 
            address?.trim() || null, 
            photo_url?.trim() || null,
            license_expiry || null
        ]);
        return result.rows[0];
    } catch (error) {
        console.error("Error in createDriver query:", error.message);
        throw error;
    }
};

// Update an existing driver
export const updateDriver = async (id, driverData) => {
    const { name, phone, license_number, status, joining_date, address, photo_url, license_expiry } = driverData;
    try {
        const result = await pool.query(`
            UPDATE drivers 
            SET name = $1, phone = $2, license_number = $3, status = $4, joining_date = $5, address = $6, photo_url = $7, license_expiry = $8
            WHERE driver_id = $9
            RETURNING *
        `, [
            name.trim(), 
            phone.trim(), 
            license_number.trim().toUpperCase(), 
            status?.toUpperCase() || 'ACTIVE', 
            joining_date, 
            address?.trim() || null, 
            photo_url?.trim() || null,
            license_expiry || null,
            id
        ]);
        return result.rows[0];
    } catch (error) {
        console.error("Error in updateDriver query:", error.message);
        throw error;
    }
};

// Delete a driver
export const deleteDriver = async (id) => {
    try {
        const result = await pool.query('DELETE FROM drivers WHERE driver_id = $1 RETURNING *', [id]);
        return result.rows[0];
    } catch (error) {
        console.error("Error in deleteDriver query:", error.message);
        throw error;
    }
};
