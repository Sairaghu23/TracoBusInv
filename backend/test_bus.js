import { updateBus } from './models/busModel.js';

async function testUpdateBus() {
    try {
        // Mock payload mimicking frontend request
        const busData = {
            seating_capacity: 50,
            engine_number: "ENG1234",
            route_id: 2,
            purchase_date: "2024-01-01",
            status: "ACTIVE",
            bus_no: 12 // Integer!
        };
        await updateBus("MH12AB1234", busData);
        console.log("updateBus success");
    } catch (err) {
        console.error("updateBus failed:", err);
    }
    process.exit(0);
}

testUpdateBus();
