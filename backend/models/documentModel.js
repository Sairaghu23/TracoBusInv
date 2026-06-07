import pool from '../config/db.js';

export const getDocumentTypes = async () => {
    try {
        const result = await pool.query('SELECT * FROM document_types ORDER BY document_name ASC');
        return result.rows;
    } catch (error) {
        console.error("Error fetching document types:", error);
        throw error;
    }
};

export const getBusDocuments = async (rcPlateNumber) => {
    try {
        const query = `
            SELECT bd.*, dt.document_name 
            FROM bus_documents bd
            JOIN document_types dt ON bd.document_type_id = dt.document_type_id
            JOIN buses b ON bd.bus_id = b.bus_id
            WHERE b.rc_plate_number = $1
            ORDER BY bd.expiry_date ASC
        `;
        const result = await pool.query(query, [rcPlateNumber]);
        return result.rows;
    } catch (error) {
        console.error("Error fetching bus documents:", error);
        throw error;
    }
};

export const createBusDocument = async (rcPlateNumber, documentTypeId, filePath, startDate, expiryDate, provider) => {
    try {
        const query = `
            INSERT INTO bus_documents (bus_id, document_type_id, file_path, start_date, expiry_date, provider)
            SELECT bus_id, $2, $3, $4, $5, $6 
            FROM buses WHERE rc_plate_number = $1
            RETURNING *
        `;
        const result = await pool.query(query, [rcPlateNumber, documentTypeId, filePath, startDate, expiryDate, provider]);
        return result.rows[0];
    } catch (error) {
        console.error("Error creating bus document:", error);
        throw error;
    }
};

<<<<<<< HEAD
export const deleteBusDocument = async (documentId) => {
    try {
        const result = await pool.query(
            'DELETE FROM bus_documents WHERE bus_document_id = $1 RETURNING file_path',
            [documentId]
        );
        return result.rows[0]; // Returns { file_path } so controller can delete the physical file
    } catch (error) {
        console.error("Error deleting bus document:", error);
        throw error;
    }
};

=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
export const getExpiringDocumentsInfo = async (days) => {
    try {
        const query = `
            SELECT b.rc_plate_number, b.bus_no, dt.document_name, bd.expiry_date, bd.provider
            FROM bus_documents bd
            JOIN document_types dt ON bd.document_type_id = dt.document_type_id
            JOIN buses b ON bd.bus_id = b.bus_id
            WHERE bd.expiry_date <= CURRENT_DATE + interval '1 day' * $1
            ORDER BY bd.expiry_date ASC
        `;
        const result = await pool.query(query, [days]);
        return result.rows;
    } catch (error) {
        console.error("Error fetching expiring documents:", error);
        throw error;
    }
};

export const getComplianceMatrix = async () => {
    try {
        // This query gets ALL buses and ALL types using a CROSS JOIN, 
        // then LEFT JOINs the latest document for each bus/type combination.
        const query = `
            SELECT 
                b.rc_plate_number, 
                b.bus_no, 
                dt.document_name, 
                dt.document_type_id,
                bd.expiry_date, 
                bd.provider
            FROM buses b
            CROSS JOIN document_types dt
            LEFT JOIN (
                SELECT DISTINCT ON (bus_id, document_type_id) 
                    bus_id, document_type_id, expiry_date, provider
                FROM bus_documents
                ORDER BY bus_id, document_type_id, expiry_date DESC
            ) bd ON b.bus_id = bd.bus_id AND dt.document_type_id = bd.document_type_id
            ORDER BY b.rc_plate_number ASC, dt.document_name ASC
        `;
        const result = await pool.query(query);
        return result.rows;
    } catch (error) {
        console.error("Error fetching compliance matrix:", error);
        throw error;
    }
};
