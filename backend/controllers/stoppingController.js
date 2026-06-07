import { createStoppingWithFee } from "../models/stoppingModel.js";

export const addStoppingController = async (req, res, next) => {
    try {
        const { route_id, stop_name, fee } = req.body;
        
        if (!route_id || !stop_name || fee === undefined) {
            return res.status(400).json({ 
                status: false, 
                message: "Route ID, stop name, and fee are all required" 
            });
        }

        const newStop = await createStoppingWithFee(stop_name, route_id, fee);
        
        res.status(201).json({
            status: true,
            message: "Stopping point and fee recorded successfully",
            data: newStop
        });
    } catch (err) {
        console.error("Error in addStoppingController:", err);
        next(err);
    }
};
