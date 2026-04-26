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
    const { spare_id, purchase_date, amount, vendor, quantity, product_codes } = purchaseData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Record the purchase
        const purchaseResult = await client.query(
            'INSERT INTO spare_purchases (spare_id, purchase_date, amount, vendor, quantity) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [spare_id, purchase_date, amount, vendor?.trim().toUpperCase(), quantity]
        );
        const purchase_id = purchaseResult.rows[0].purchase_id;

        // 2. Insert individual product codes into spare_inventory
        if (product_codes && Array.isArray(product_codes)) {
            for (const code of product_codes) {
                await client.query(
                    'INSERT INTO spare_inventory (spare_id, purchase_id, product_code, status) VALUES ($1, $2, $3, $4)',
                    [spare_id, purchase_id, code.trim().toUpperCase(), 'AVAILABLE']
                );
            }
        }

        // 3. Update the stock quantity
        await client.query(
            'UPDATE spare_stocks SET quantity = (SELECT COUNT(*) FROM spare_inventory WHERE spare_id = $1 AND status = $2) WHERE spare_id = $1',
            [spare_id, 'AVAILABLE']
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
        SELECT u.*, s.spare_name,
               (u.new_reading - u.old_reading) as distance,
               string_agg(i.product_code, \', \') as product_codes
        FROM spare_usage u
        JOIN spare_stocks s ON u.spare_id = s.spare_id
        JOIN buses b ON u.bus_id = b.bus_id
        LEFT JOIN spare_inventory i ON u.usage_id = i.usage_id
        WHERE b.rc_plate_number = $1
        GROUP BY u.usage_id, s.spare_name
        ORDER BY u.usage_date DESC
    `, [rc_plate_number.trim().toUpperCase()]);
    return result.rows;
};

export const recordUsage = async (usageData) => {
    const { rc_plate_number, spare_id, item_ids, usage_date, mechanic, labor_charges, parts_cost, quantity, old_reading, new_reading } = usageData;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 0. Extract corresponding bus_id
        const busQuery = await client.query('SELECT bus_id FROM buses WHERE rc_plate_number = $1', [rc_plate_number.trim().toUpperCase()]);
        if (busQuery.rows.length === 0) throw new Error('Vehicle Identity Authentication Failure.');
        const active_bus = busQuery.rows[0].bus_id;

        // 1. Record the usage
        // Note: amount is total cost (parts + labor)
        const total_amount = parseFloat(parts_cost || 0) + parseFloat(labor_charges || 0);
        const usageResult = await client.query(
            'INSERT INTO spare_usage (bus_id, spare_id, usage_date, mechanic, amount, quantity, labor_charges, parts_cost, old_reading, new_reading) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
            [active_bus, spare_id, usage_date, mechanic?.trim().toUpperCase(), total_amount, quantity, labor_charges, parts_cost, old_reading, new_reading]
        );
        const usage_id = usageResult.rows[0].usage_id;

        // 2. Mark items as USED and link to usage
        if (item_ids && Array.isArray(item_ids)) {
            for (const item_id of item_ids) {
                await client.query(
                    'UPDATE spare_inventory SET status = $1, usage_id = $2 WHERE item_id = $3',
                    ['USED', usage_id, item_id]
                );
            }
        }

        // 3. Decrement the stock quantity
        await client.query(
            'UPDATE spare_stocks SET quantity = (SELECT COUNT(*) FROM spare_inventory WHERE spare_id = $1 AND status = $2) WHERE spare_id = $1',
            [spare_id, 'AVAILABLE']
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

// --- INVENTORY HELPERS ---

export const getInventoryBySpare = async (spare_id, status = 'AVAILABLE') => {
    const result = await pool.query(
        'SELECT * FROM spare_inventory WHERE spare_id = $1 AND ($2 = \'ALL\' OR status = $2) ORDER BY product_code ASC',
        [spare_id, status]
    );
    return result.rows;
};

export const getProductCodesByPurchase = async (purchase_id) => {
    const result = await pool.query(
        'SELECT * FROM spare_inventory WHERE purchase_id = $1 ORDER BY product_code ASC',
        [purchase_id]
    );
    return result.rows;
};

export const getProductCodesByUsage = async (usage_id) => {
    const result = await pool.query(
        'SELECT * FROM spare_inventory WHERE usage_id = $1 ORDER BY product_code ASC',
        [usage_id]
    );
    return result.rows;
};
