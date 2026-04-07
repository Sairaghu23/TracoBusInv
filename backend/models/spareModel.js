import pool from '../config/db.js';

// --- STOCKS ---

export const getAllStocks = async () => {
    const result = await pool.query('SELECT * FROM spare_stocks ORDER BY spare_name ASC');
    return result.rows;
};

export const addSpareType = async (spare_name) => {
    const result = await pool.query(
        'INSERT INTO spare_stocks (spare_name, quantity) VALUES ($1, 0) RETURNING *',
        [spare_name.trim().toUpperCase()]
    );
    return result.rows[0];
};

// --- PURCHASES (Restock) ---

export const recordPurchase = async (purchaseData) => {
    const { spare_id, purchase_date, amount, vendor, quantity } = purchaseData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Record the purchase
        const purchaseResult = await client.query(
            'INSERT INTO spare_purchases (spare_id, purchase_date, amount, vendor, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [spare_id, purchase_date, amount, vendor?.trim().toUpperCase(), quantity]
        );

        // 2. Update the stock quantity
        await client.query(
            'UPDATE spare_stocks SET quantity = quantity + $1 WHERE spare_id = $2',
            [quantity, spare_id]
        );

        await client.query('COMMIT');
        return purchaseResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// --- USAGE (Bus Replacements) ---

export const getUsageByBus = async (rc_plate_number) => {
    const result = await pool.query(`
        SELECT u.*, s.spare_name, r.old_reading, r.new_reading 
        FROM spare_usage u
        JOIN spare_stocks s ON u.spare_id = s.spare_id
        JOIN buses b ON u.bus_id = b.bus_id
        LEFT JOIN bus_readings r ON u.bus_id = r.bus_id AND u.usage_date::DATE = r.end_date::DATE
        WHERE b.rc_plate_number = $1
        ORDER BY u.usage_date DESC
    `, [rc_plate_number.trim().toUpperCase()]);
    return result.rows;
};

export const recordUsage = async (usageData) => {
    const { rc_plate_number, spare_id, product_code, usage_date, mechanic, amount, quantity } = usageData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 0. Extract corresponding bus_id securely avoiding hard dependencies
        const busQuery = await client.query('SELECT bus_id FROM buses WHERE rc_plate_number = $1', [rc_plate_number.trim().toUpperCase()]);
        if (busQuery.rows.length === 0) throw new Error('Vehicle Identity Authentication Failure.');
        const active_bus = busQuery.rows[0].bus_id;

        // 1. Check if stock exists matching validated constraints limits
        const stockCheck = await client.query('SELECT quantity FROM spare_stocks WHERE spare_id = $1', [spare_id]);
        if (stockCheck.rows.length === 0 || stockCheck.rows[0].quantity < quantity || quantity < 1) {
            throw new Error('Insufficient stock for this spare part.');
        }

        // 2. Record the usage mapping variable components securely over Native DB schemas
        const usageResult = await client.query(
            'INSERT INTO spare_usage (bus_id, spare_id, usage_date, mechanic, amount, quantity, product_code) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [active_bus, spare_id, usage_date, mechanic?.trim().toUpperCase(), amount, quantity, product_code]
        );

        // 3. Decrement the specific requested metric mapping inventory calculations globally
        await client.query(
            'UPDATE spare_stocks SET quantity = quantity - $1 WHERE spare_id = $2',
            [quantity, spare_id]
        );

        await client.query('COMMIT');
        return usageResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};

// --- PURCHASE LOGS FOR SPECIFIC SPARE ---

export const getPurchasesBySpare = async (spare_id) => {
    const result = await pool.query(
        'SELECT * FROM spare_purchases WHERE spare_id = $1 ORDER BY purchase_date DESC',
        [spare_id]
    );
    return result.rows;
};
