import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Calendar, User, ShoppingBag } from 'lucide-react';

export default function BusSpares() {
    const { id: rc_plate_number } = useParams();
    const navigate = useNavigate();

    const [bus, setBus] = useState(null);
    const [spares, setSpares] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [readingExists, setReadingExists] = useState(false);
    const [readingErrorMsg, setReadingErrorMsg] = useState('');

    const [usageData, setUsageData] = useState({
        spare_id: '',
        product_code: '',
        usage_date: new Date().toISOString().split('T')[0],
        mechanic: '',
        amount: '',
        quantity: 1
    });

    // Fetch data when date changes
    const checkReadingStatus = async (selectedDate) => {
        setReadingErrorMsg('');
        try {
            const res = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/readings/date/${selectedDate}`);
            const result = await res.json();

            if (result.status && result.data) {
                setReadingExists(true);
                setReadingErrorMsg('');
            } else {
                setReadingExists(false);
                setReadingErrorMsg(`Please enter the Odometer reading for ${new Date(selectedDate).toLocaleDateString()} before logging spare parts.`);
            }
        } catch (err) {
            setReadingExists(false);
        }
    };

    useEffect(() => {
        if (usageData.usage_date) {
            checkReadingStatus(usageData.usage_date);
        }
    }, [usageData.usage_date, rc_plate_number]);


    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Bus Details
            const busRes = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}`);
            const busResult = await busRes.json();
            if (busResult.status) setBus(busResult.data);

            // Fetch Usage History
            const usageRes = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/spares`);
            const usageResult = await usageRes.json();
            if (usageResult.status) setSpares(usageResult.data);

            // Fetch Available Stocks (for selection)
            const stocksRes = await fetch('http://localhost:5001/api/spares/stocks');
            const stocksResult = await stocksRes.json();
            if (stocksResult.status) setStocks(stocksResult.data);

        } catch (err) {
            console.error("Error fetching bus spares:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [rc_plate_number]);

    const handleReplacementSubmit = async () => {
        try {
            const res = await fetch(`http://localhost:5001/api/buses/${rc_plate_number}/spares`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usageData)
            });
            const result = await res.json();
            if (result.status) {
                alert("Replacement logged and stock deducted!");
                setIsAddModalOpen(false);
                setUsageData({
                    spare_id: '',
                    product_code: '',
                    usage_date: new Date().toISOString().split('T')[0],
                    mechanic: '',
                    amount: '',
                    quantity: 1
                });
                fetchData();
            } else {
                alert(result.message || "Failed to log replacement.");
            }
        } catch (err) {
            console.error("Error logging replacement:", err);
            alert("Error: Check console or insufficient stock.");
        }
    };

    const totalExpenditure = spares.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <button
                onClick={() => navigate(`/buses/${rc_plate_number}`)}
                className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-navy transition-colors"
            >
                <ChevronLeft size={16} /> Back to {bus?.rc_plate_number || 'Vehicle'}
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Settings size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Spare Parts Records</h1>
                        <p className="text-slate-500 text-sm">Hardware replacements and part lifecycle logs.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary shadow-lg shadow-blue-100"
                >
                    <Plus size={18} /> Register Replacement
                </button>
            </div>

            {/* Totals Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-blue-100">
                    <ShoppingBag size={32} />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Maintanance Expenditure</p>
                    <h2 className="text-4xl font-black text-navy italic">₹{totalExpenditure.toLocaleString()}</h2>
                </div>
                <div className="md:ml-auto border-l border-slate-100 pl-8 hidden md:block">
                    <p className="text-xs text-slate-400 font-bold mb-1 uppercase tracking-tighter">Last Replacement</p>
                    <p className="font-bold text-slate-700">
                        {spares.length > 0 ? new Date(spares[0].usage_date).toLocaleDateString() : 'No history yet'}
                    </p>
                </div>
            </div>

            {/* History Table */}
            <div className="table-container shadow-md border border-slate-100 rounded-2xl overflow-hidden">
                <table className="admin-table">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="py-4 pl-8 text-left uppercase tracking-widest text-[10px] font-black">Date</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Old ODO</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">New ODO</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Distance</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Category</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Product Code</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Units</th>
                            <th className="py-4 text-left uppercase tracking-widest text-[10px] font-black">Mechanic</th>
                            <th className="py-4 pr-8 text-right uppercase tracking-widest text-[10px] font-black">Cost (₹)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {spares.map((record) => (
                            <tr key={record.usage_id} className="hover:bg-emerald-50/30 transition-colors">
                                <td className="py-4 pl-8 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="font-semibold text-xs">{new Date(record.usage_date).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="py-4 font-semibold text-slate-600 text-xs">
                                    {record.old_reading ? record.old_reading.toLocaleString() : 0}
                                </td>
                                <td className="py-4 font-bold text-navy text-xs">
                                    {record.new_reading ? record.new_reading.toLocaleString() : 0}
                                </td>
                                <td className="py-4 font-black text-emerald-600 text-xs">
                                    {(record.new_reading && record.old_reading) ? (record.new_reading - record.old_reading).toLocaleString() + ' km' : 0}
                                </td>
                                <td className="py-4">
                                    <span className="font-bold text-navy uppercase text-[10px] tracking-wide px-2 py-1 bg-slate-100 rounded">
                                        {record.spare_name}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <span className="font-bold text-navy uppercase text-[10px] tracking-wide px-2 py-1 bg-slate-100 rounded">
                                        {record.product_code}
                                    </span>
                                </td>
                                <td className="py-4 whitespace-nowrap">
                                    <span className="font-black text-slate-700 text-xs">{record.quantity || 1}</span>
                                    <span className="text-slate-400 text-[10px] ml-1 uppercase">units</span>
                                </td>
                                <td className="py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <User size={12} className="text-slate-400" />
                                        <span className="font-medium text-slate-700 text-xs">{record.mechanic}</span>
                                    </div>
                                </td>
                                <td className="py-4 pr-8 text-right font-black text-navy text-sm whitespace-nowrap">
                                    ₹{parseFloat(record.amount || 0).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {spares.length === 0 && (
                            <tr>
                                <td colSpan="9" className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Settings size={48} className="text-slate-100" />
                                        <p className="text-slate-400 font-medium italic">No replacement records found for this vehicle.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 scale-100 animate-in zoom-in-95">
                        <div className="bg-navy p-8 text-white">
                            <h2 className="text-2xl font-bold">Log Spare Part Replacement</h2>
                            <p className="text-blue-200 text-sm mt-1 opacity-80 italic">Select part from inventory to deduct stock.</p>
                        </div>

                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Choose Part from Inventory</label>
                                {readingErrorMsg && (
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-bold border border-red-200 rounded-xl animate-pulse">
                                        ⚠️ {readingErrorMsg}
                                    </div>
                                )}
                                <select
                                    className="form-input bg-emerald-50 border-emerald-100 text-navy font-bold focus:border-emerald-500"
                                    value={usageData.spare_id}
                                    onChange={(e) => setUsageData({ ...usageData, spare_id: e.target.value })}
                                >
                                    <option value="">-- Click to Select Available Part --</option>
                                    {stocks.map(s => (
                                        <option key={s.spare_id} value={s.spare_id} disabled={s.quantity === 0}>
                                            {s.spare_name} ({s.quantity} units in stock)
                                        </option>
                                    ))}
                                </select>
                                {/* Validation Feedback */}
                                {usageData.spare_id && usageData.quantity > (stocks.find(s => s.spare_id === parseInt(usageData.spare_id))?.quantity || 0) && (
                                    <p className="text-red-500 text-xs mt-2 font-bold animate-in fade-in">⚠️ INSUFFICIENT STOCK! Re-enter a smaller amount or restock inventory.</p>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Product Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={usageData.product_code}
                                        onChange={(e) => setUsageData({ ...usageData, product_code: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Date of Work</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={usageData.usage_date}
                                        onChange={(e) => setUsageData({ ...usageData, usage_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Mechanic Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Service Engineer"
                                        value={usageData.mechanic}
                                        onChange={(e) => setUsageData({ ...usageData, mechanic: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-6">
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Units (Quantity)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className={`form-input bg-slate-50 font-black text-lg text-navy transition-all ${usageData.spare_id && usageData.quantity > (stocks.find(s => s.spare_id === parseInt(usageData.spare_id))?.quantity || 0)
                                            ? 'border-2 border-red-400 bg-red-50 text-red-600 focus:border-red-500'
                                            : 'border-slate-200'
                                            }`}
                                        value={usageData.quantity}
                                        onChange={(e) => setUsageData({ ...usageData, quantity: parseInt(e.target.value) || '' })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Labor + Part Total (₹)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                        <input
                                            type="number"
                                            className="form-input pl-10 bg-slate-50 border-slate-200 font-black text-lg text-navy"
                                            placeholder="0.00"
                                            value={usageData.amount}
                                            onChange={(e) => setUsageData({ ...usageData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 pt-4 flex justify-between gap-4 bg-slate-50">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 font-bold text-slate-400">Discard</button>
                            <button
                                onClick={handleReplacementSubmit}
                                className={`btn px-10 rounded-2xl shadow-xl transition-all ${!usageData.spare_id || !usageData.mechanic || !usageData.amount || !usageData.quantity || !readingExists || usageData.quantity > (stocks.find(s => s.spare_id === parseInt(usageData.spare_id))?.quantity || 0)
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'btn-primary shadow-blue-100 hover:scale-[1.02]'
                                    }`}
                                disabled={!usageData.spare_id || !usageData.mechanic || !usageData.amount || !usageData.quantity || !readingExists || usageData.quantity > (stocks.find(s => s.spare_id === parseInt(usageData.spare_id))?.quantity || 0)}
                            >
                                Process Service Entry
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
