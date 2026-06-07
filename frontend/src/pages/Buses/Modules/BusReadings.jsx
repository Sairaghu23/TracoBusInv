import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Gauge, Calendar, Navigation } from 'lucide-react';
<<<<<<< HEAD
import api from '../../../utils/api';
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

export default function BusReadings() {
    const { id: rc_plate_number } = useParams();
    const navigate = useNavigate();

    const [bus, setBus] = useState(null);
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [newReadingData, setNewReadingData] = useState({
        trip_start_date: new Date().toISOString().split('T')[0],
        trip_end_date: new Date().toISOString().split('T')[0],
        old_reading: '',
        new_reading: ''
    });

    // Fetch Bus and Readings
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch Bus Details
<<<<<<< HEAD
                const busRes = await api.get(`/api/buses/${rc_plate_number}`);
                if (busRes.data?.status) {
                    setBus(busRes.data.data);
                }

                // Fetch Readings
                const readingsRes = await api.get(`/api/buses/${rc_plate_number}/readings`);
                if (readingsRes.data?.status) {
                    setReadings(readingsRes.data.data);
                }

                // Fetch Latest reading for pre-fill
                const latestRes = await api.get(`/api/buses/${rc_plate_number}/readings/latest`);
                if (latestRes.data?.status && latestRes.data.data) {
                    setNewReadingData(prev => ({ 
                        ...prev, 
                        old_reading: latestRes.data.data.new_reading,
                        trip_start_date: latestRes.data.data.end_date || prev.trip_start_date
                    }));
                } else if (busRes.data?.data) {
=======
                const busRes = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}`);
                const busResult = await busRes.json();
                if (busResult.status) {
                    setBus(busResult.data);
                }

                // Fetch Readings
                const readingsRes = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/readings`);
                const readingsResult = await readingsRes.json();
                if (readingsResult.status) {
                    setReadings(readingsResult.data);
                }

                // Fetch Latest reading for pre-fill
                const latestRes = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/readings/latest`);
                const latestResult = await latestRes.json();
                if (latestResult.status && latestResult.data) {
                    setNewReadingData(prev => ({ 
                        ...prev, 
                        old_reading: latestResult.data.new_reading,
                        trip_start_date: latestResult.data.end_date || prev.trip_start_date
                    }));
                } else if (busResult.data) {
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                    // Fallback to initial bus capacity or 0 if no readings yet
                    // Note: You might want to have an initial_odometer in buses table
                    setNewReadingData(prev => ({ ...prev, old_reading: 0 }));
                }

            } catch (err) {
                console.error("Error fetching readings data:", err);
                setError("Failed to load records.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rc_plate_number]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReadingData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveReading = async () => {
        try {
<<<<<<< HEAD
            const result = await api.post(`/api/buses/${rc_plate_number}/readings`, newReadingData);
            if (result.data?.status) {
                alert("Trip log saved successfully!");
                setIsAddModalOpen(false);
                // Refresh data
                const readingsRes = await api.get(`/api/buses/${rc_plate_number}/readings`);
                if (readingsRes.data?.status) setReadings(readingsRes.data.data);
=======
            const response = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/readings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReadingData)
            });
            const result = await response.json();
            if (result.status) {
                alert("Trip log saved successfully!");
                setIsAddModalOpen(false);
                // Refresh data
                const readingsRes = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/readings`);
                const readingsResult = await readingsRes.json();
                if (readingsResult.status) setReadings(readingsResult.data);
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

                // Update old_reading for next log
                setNewReadingData({
                    trip_start_date: newReadingData.trip_end_date, // Setup next trip with today's end date
                    trip_end_date: new Date().toISOString().split('T')[0],
<<<<<<< HEAD
                    old_reading: result.data.data.new_reading,
                    new_reading: ''
                });
            } else {
                alert(result.data?.message || "Failed to save log");
=======
                    old_reading: result.data.new_reading,
                    new_reading: ''
                });
            } else {
                alert(result.message || "Failed to save log");
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
            }
        } catch (err) {
            console.error("Error saving reading:", err);
            alert("An error occurred while saving.");
        }
    };

    const totalDistanceRecorded = readings.reduce((sum, record) => sum + (record.new_reading - record.old_reading), 0);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <button
                onClick={() => navigate(`/buses/${rc_plate_number}`)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors mb-2"
            >
                <ChevronLeft size={16} /> Back to {bus?.rc_plate_number || 'Bus'}
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-navy flex items-center gap-3">
                        <Gauge className="text-purple-600" size={32} />
                        Odometer Trip Database
                    </h1>
                    <p className="text-slate-500 mt-1">Detailed history of mileage and trip logs for this vehicle.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary shadow-lg shadow-blue-200"
                >
                    <Plus size={18} /> Log New Trip
                </button>
            </div>

            {/* Summary Stat Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 flex-shrink-0">
                    <Navigation size={32} />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Total Distance Traveled (Logged)</p>
                    <h2 className="text-4xl font-black text-navy">{totalDistanceRecorded.toLocaleString()} <span className="text-xl font-normal text-slate-400 italic ml-1">km</span></h2>
                </div>
                <div className="md:ml-auto h-full hidden md:block border-l border-slate-100 pl-8">
                    <p className="text-xs text-slate-400 font-medium mb-1 italic">Last Trip Date</p>
                    <p className="font-bold text-slate-700">
                        {readings.length > 0 ? new Date(readings[0].end_date).toLocaleDateString() : 'No logs yet'}
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="table-container shadow-md border border-slate-100 rounded-2xl overflow-hidden">
                <table className="admin-table">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="py-4">Trip Period</th>
                            <th>Start Odometer</th>
                            <th>End Odometer</th>
<<<<<<< HEAD
                            <th>Net Distance</th>
                            <th className="text-right">Logged At</th>
=======
                            <th className="text-right">Net Distance</th>
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {readings.map((record) => {
                            const distance = record.new_reading - record.old_reading;
                            return (
                                <tr key={record.reading_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span className="font-semibold text-slate-700">{new Date(record.start_date).toLocaleDateString()}</span>
                                            <span className="text-slate-300">→</span>
                                            <span className="font-semibold text-slate-700">{new Date(record.end_date).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="text-slate-500 font-mono">{record.old_reading.toLocaleString()} km</td>
                                    <td className="text-slate-500 font-mono">{record.new_reading.toLocaleString()} km</td>
<<<<<<< HEAD
                                    <td>
=======
                                    <td className="text-right">
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                                        <span className="inline-block px-4 py-1.5 rounded-lg font-black text-purple-700 bg-purple-50 border border-purple-100">
                                            {distance.toLocaleString()} km
                                        </span>
                                    </td>
<<<<<<< HEAD
                                    <td className="text-right">
                                        <span className="text-xs text-slate-400 font-mono">
                                            {record.created_at
                                                ? new Date(record.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                : '—'}
                                        </span>
                                    </td>
=======
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                                </tr>
                            )
                        })}
                        {readings.length === 0 && (
                            <tr>
<<<<<<< HEAD
                                <td colSpan="5" className="py-20 text-center">
=======
                                <td colSpan="4" className="py-20 text-center">
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                                    <div className="flex flex-col items-center gap-3">
                                        <Gauge size={48} className="text-slate-200" />
                                        <p className="text-slate-400 font-medium">No trip records found for this vehicle.</p>
                                        <button onClick={() => setIsAddModalOpen(true)} className="text-blue-500 font-bold hover:underline">Log your first trip</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
                        <div className="bg-navy p-8 text-white relative">
                            <h2 className="text-2xl font-bold">Log New Trip Reading</h2>
                            <p className="text-blue-200 text-sm mt-1 opacity-80">Enter precise odometer values for accuracy.</p>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="absolute right-6 top-6 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all font-bold"
                            >
                                ×
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Trip Start Date</label>
                                    <input
                                        type="date"
                                        name="trip_start_date"
                                        value={newReadingData.trip_start_date}
                                        onChange={handleInputChange}
                                        className="form-input bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Trip End Date</label>
                                    <input
                                        type="date"
                                        name="trip_end_date"
                                        value={newReadingData.trip_end_date}
                                        onChange={handleInputChange}
                                        className="form-input bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
<<<<<<< HEAD
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Opening Reading
                                        <span className="ml-2 text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">AUTO-FILLED · LOCKED</span>
                                    </label>
=======
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Opening Reading</label>
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="old_reading"
                                            value={newReadingData.old_reading}
<<<<<<< HEAD
                                            readOnly
                                            className="form-input bg-slate-100 border-slate-200 pr-10 font-mono cursor-not-allowed text-slate-500"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">km</span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 italic">Auto-filled from the last recorded trip closing reading.</p>
=======
                                            onChange={handleInputChange}
                                            className="form-input bg-slate-50 border-slate-200 pr-10 font-mono"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">km</span>
                                    </div>
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Closing Reading</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            name="new_reading"
                                            value={newReadingData.new_reading}
                                            onChange={handleInputChange}
                                            className="form-input border-purple-200 focus:border-purple-500 pr-10 font-mono"
                                            placeholder="Current km"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 text-xs font-bold">km</span>
                                    </div>
                                </div>
                            </div>

                            {/* Live Calculation */}
                            {newReadingData.new_reading && newReadingData.old_reading && (
                                <div className={`p-4 rounded-2xl flex items-center justify-between border ${parseInt(newReadingData.new_reading) < parseInt(newReadingData.old_reading) ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    <span className="text-sm font-bold">Trip Distance Calculation:</span>
                                    <span className="text-lg font-black">{parseInt(newReadingData.new_reading) - parseInt(newReadingData.old_reading)} km</span>
                                </div>
                            )}
                        </div>

                        <div className="p-8 pt-4 flex justify-between gap-4">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                            <button
                                onClick={handleSaveReading}
                                className="btn btn-primary px-10 py-3 rounded-2xl shadow-xl shadow-blue-100"
                                disabled={!newReadingData.new_reading || parseInt(newReadingData.new_reading) <= parseInt(newReadingData.old_reading)}
                            >
                                Submit Log Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
