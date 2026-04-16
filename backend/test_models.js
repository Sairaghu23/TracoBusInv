import { getAllRoutesWithStops } from './models/routeModel.js';
import { getAllBuses } from './models/busModel.js';
import { getStudentsBySemester } from './models/studentModel.js';
import { getStoppingsByRoute } from './models/stoppingModel.js';

async function test() {
    console.log("Testing getAllRoutesWithStops...");
    try {
        await getAllRoutesWithStops();
        console.log("getAllRoutesWithStops passed.");
    } catch (e) {
        console.error("getAllRoutesWithStops failed:", e.message);
    }

    console.log("\nTesting getAllBuses...");
    try {
        await getAllBuses();
        console.log("getAllBuses passed.");
    } catch (e) {
        console.error("getAllBuses failed:", e.message);
    }

    console.log("\nTesting getStudentsBySemester (btech)...");
    try {
        await getStudentsBySemester('btech', 0, 1);
        console.log("getStudentsBySemester(btech) passed.");
    } catch (e) {
        console.error("getStudentsBySemester(btech) failed:", e.message);
    }

    console.log("\nTesting getStoppingsByRoute...");
    try {
        await getStoppingsByRoute(1);
        console.log("getStoppingsByRoute passed.");
    } catch (e) {
        console.error("getStoppingsByRoute failed:", e.message);
    }
    
    process.exit(0);
}

test();
