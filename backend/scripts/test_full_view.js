import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { createBusDocument } from '../models/documentModel.js';

async function testUpload() {
    const rc_plate_number = 'AP26TD5585';
    const uniqueSuffix = Date.now();
    const filename = `${rc_plate_number}-${uniqueSuffix}.pdf`;
    const filePath = `/api/uploads/${filename}`;
    const fullPath = path.resolve('uploads', filename);

    // 1. Create the dummy file
    if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
    fs.writeFileSync(fullPath, 'DUMMY PDF CONTENT');
    console.log("File created at:", fullPath);

    try {
        // 2. Insert into DB (Assume document_type_id 1 exists)
        const typesRes = await pool.query("SELECT document_type_id FROM document_types LIMIT 1");
        const typeId = typesRes.rows[0].document_type_id;

        await createBusDocument(rc_plate_number, typeId, filePath, '2026-01-01', '2026-12-31', 'TEST PROVIDER');
        console.log("DB Record created with path:", filePath);
        
        console.log("Now check: https://tracobusinvcicd.duckdns.org" + filePath);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}
testUpload();
