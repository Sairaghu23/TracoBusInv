import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Settings, Calendar, User, ShoppingBag } from 'lucide-react';
import api from '../../../utils/api';

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
        usage_date: new Date().toISOString().split('T')[0],
        mechanic: '',
        parts_cost: '',
        labor_charges: '',
        quantity: 1,
        old_reading: '',
        new_reading: ''
    });
    const [lastOdometer, setLastOdometer] = useState(0);
    const [availableCodes, setAvailableCodes] = useState([]);
    const [selectedItemIds, setSelectedItemIds] = useState([]);
    const [loadingCodes, setLoadingCodes] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const busRes = await api.get(`/api/buses/${rc_plate_number}`);
            if (busRes.data?.status) setBus(busRes.data.data);

            const usageRes = await api.get(`/api/buses/${rc_plate_number}/spares`);
            if (usageRes.data?.status) {
                setSpares(usageRes.data.data);
                if (usageRes.data.data.length > 0) {
                    const last = usageRes.data.data[0].new_reading || 0;
                    setLastOdometer(last);
                    setUsageData(prev => ({ ...prev, old_reading: last }));
                }
            }

            const stocksRes = await api.get('/api/spares/stocks');
            if (stocksRes.data?.status) setStocks(stocksRes.data.data);

        } catch (err) {
            console.error("Error fetching bus spares:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableCodes = async (spareId) => {
        setLoadingCodes(true);
        try {
            const result = await api.get(`/api/spares/inventory/${spareId}?status=AVAILABLE`);
            if (result.data?.status) {
                setAvailableCodes(result.data.data);
                setSelectedItemIds([]);
            }
        } catch (err) {
            console.error("Error fetching available codes:", err);
        } finally {
            setLoadingCodes(false);
        }
    };

    useEffect(() => {
        if (usageData.spare_id) {
            fetchAvailableCodes(usageData.spare_id);
        } else {
            setAvailableCodes([]);
            setSelectedItemIds([]);
        }
    }, [usageData.spare_id]);

    useEffect(() => {
        fetchData();
    }, [rc_plate_number]);

    const handleCodeToggle = (itemId) => {
        setSelectedItemIds(prev => {
            if (prev.includes(itemId)) {
                return prev.filter(id => id !== itemId);
            } else {
                if (prev.length < usageData.quantity) {
                    return [...prev, itemId];
                } else {
                    // Replace the first one or just ignore
                    return [...prev.slice(1), itemId];
                }
            }
        });
    };

    const handleReplacementSubmit = async () => {
        if (selectedItemIds.length !== parseInt(usageData.quantity)) {
            alert(`Please select exactly ${usageData.quantity} product codes.`);
            return;
        }
        try {
            const payload = {
                ...usageData,
                item_ids: selectedItemIds
            };
            const result = await api.post(`/api/buses/${rc_plate_number}/spares`, payload);
            if (result.data?.status) {
                alert("Replacement logged and stock deducted!");
                setIsAddModalOpen(false);
                setUsageData({
                    spare_id: '',
                    usage_date: new Date().toISOString().split('T')[0],
                    mechanic: '',
                    parts_cost: '',
                    labor_charges: '',
                    quantity: 1,
                    old_reading: lastOdometer,
                    new_reading: ''
                });
                setSelectedItemIds([]);
                fetchData();
            } else {
                alert(result.data?.message || "Failed to log replacement.");
            }
        } catch (err) {
            console.error("Error logging replacement:", err);
            alert("Error saving record. Check input fields.");
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
                    className="btn btn-primary shadow-lg shadow-blue-100 px-8 py-3 rounded-2xl"
                >
                    <Plus size={18} /> Register Replacement
                </button>
            </div>

            {/* Totals Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="w-20 h-20 bg-navy rounded-3xl flex items-center justify-center text-white flex-shrink-0 shadow-xl shadow-blue-100 rotate-3">
                    <ShoppingBag size={40} />
                </div>
                <div className="text-center md:text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Maintanance Expenditure</p>
                    <h2 className="text-5xl font-black text-navy italic">₹{totalExpenditure.toLocaleString()}</h2>
                </div>
                <div className="md:ml-auto border-l border-slate-100 pl-8 hidden md:block">
                    <p className="text-[10px] text-slate-400 font-black mb-1 uppercase tracking-widest">Last Replacement</p>
                    <p className="font-bold text-xl text-slate-700">
                        {spares.length > 0 ? new Date(spares[0].usage_date).toLocaleDateString() : 'No history yet'}
                    </p>
                </div>
            </div>

            {/* History Table */}
            <div className="table-container shadow-2xl border border-slate-100 rounded-3xl overflow-hidden">
                <table className="admin-table">
                    <thead className="bg-slate-50 text-slate-500">
                        <tr>
                            <th className="py-6 pl-8 text-left uppercase tracking-widest text-[10px] font-black">Date</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">Old ODO</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">New ODO</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">Distance</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">Category</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">Units</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">Mechanic</th>
                            <th className="py-6 text-left uppercase tracking-widest text-[10px] font-black">Cost (₹)</th>
                            <th className="py-6 pr-8 text-right uppercase tracking-widest text-[10px] font-black">Logged At</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {spares.map((record) => (
                            <tr key={record.usage_id} className="hover:bg-emerald-50/40 transition-colors group">
                                <td className="py-5 pl-8 whitespace-nowrap">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span className="font-bold text-sm tracking-tight">{new Date(record.usage_date).toLocaleDateString()}</span>
                                    </div>
                                </td>
                                <td className="py-5 font-semibold text-slate-500 text-xs text-center">
                                    {record.old_reading ? record.old_reading.toLocaleString() : 0}
                                </td>
                                <td className="py-5 font-bold text-navy text-xs text-center">
                                    {record.new_reading ? record.new_reading.toLocaleString() : 0}
                                </td>
                                <td className="py-5 font-black text-emerald-600 text-xs text-center bg-emerald-50/20">
                                    <span className="px-2 py-1 rounded bg-white">
                                        {record.distance ? record.distance.toLocaleString() + ' km' : '0 km'}
                                    </span>
                                </td>
                                <td className="py-5">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-black text-navy uppercase text-[10px] tracking-widest px-3 py-1 bg-slate-100 rounded-full w-fit">
                                            {record.spare_name}
                                        </span>
                                        <span className="text-[9px] text-slate-400 italic">Codes: {record.product_codes || 'N/A'}</span>
                                    </div>
                                </td>
                                <td className="py-5 whitespace-nowrap text-center">
                                    <span className="font-black text-slate-700 text-sm">{record.quantity || 1}</span>
                                    <span className="text-[10px] text-slate-400 ml-1 font-black uppercase">qty</span>
                                </td>
                                <td className="py-5 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-navy/10 flex items-center justify-center">
                                            <User size={12} className="text-navy" />
                                        </div>
                                        <span className="font-black text-slate-700 text-xs uppercase tracking-tighter">{record.mechanic}</span>
                                    </div>
                                </td>
                                <td className="py-5 pr-8 text-right font-black text-navy text-base whitespace-nowrap">
                                    ₹{parseFloat(record.amount || 0).toLocaleString()}
                                </td>
                                <td className="py-5 pr-8 text-right text-[10px] text-slate-400 font-mono whitespace-nowrap group-hover:text-navy transition-colors">
                                    {record.created_at
                                        ? new Date(record.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                        {spares.length === 0 && (
                            <tr>
                                <td colSpan="9" className="py-32 text-center bg-slate-50/50">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-20 h-20 bg-white rounded-3xl shadow-inner flex items-center justify-center text-slate-200">
                                            <Settings size={48} className="animate-spin-slow" />
                                        </div>
                                        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Purge Complete: No Logs Found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-navy/80 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-500">
                    <div className="bg-white rounded-[2.5rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-4xl overflow-hidden border border-white/20 animate-in zoom-in-95 flex flex-col md:flex-row h-[90vh]">
                        
                        {/* Sidebar Info */}
                        <div className="md:w-80 bg-navy p-10 text-white flex flex-col justify-between flex-shrink-0">
                            <div>
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-inner">
                                    <Settings className="text-emerald-400" size={32} />
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter mb-2">Service Lifecycle</h2>
                                <p className="text-blue-200 text-xs font-medium uppercase tracking-[0.2em] leading-relaxed opacity-60">Register hardware replacements and maintenance hours.</p>
                                
                                <div className="mt-20 space-y-8">
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Estimated ODO</p>
                                        <p className="text-3xl font-black">{usageData.new_reading || lastOdometer} <span className="text-lg opacity-50 italic">km</span></p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                        <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1">Total Impact Cost</p>
                                        <p className="text-4xl font-black italic text-emerald-400">₹{(parseFloat(usageData.parts_cost || 0) + parseFloat(usageData.labor_charges || 0)).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-10 border-t border-white/10">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4">Verification Status</p>
                                <div className="flex gap-2">
                                    <div className={`w-3 h-3 rounded-full ${usageData.spare_id ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                    <div className={`w-3 h-3 rounded-full ${selectedItemIds.length === usageData.quantity ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                    <div className={`w-3 h-3 rounded-full ${usageData.new_reading ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                </div>
                            </div>
                        </div>

                        {/* Main Form Area */}
                        <div className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 p-10 overflow-y-auto space-y-10">
                                
                                {/* Form Section 1: Part Selection */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-black">01</span>
                                        <h3 className="text-lg font-black text-navy uppercase tracking-tighter">Inventory Allocation</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Spare Classification</label>
                                            <select
                                                className="form-input bg-slate-50 border-slate-100 font-bold text-navy h-14 rounded-2xl focus:bg-white transition-all shadow-sm"
                                                value={usageData.spare_id}
                                                onChange={(e) => setUsageData({ ...usageData, spare_id: e.target.value })}
                                            >
                                                <option value="">-- Choose Category --</option>
                                                {stocks.map(s => (
                                                    <option key={s.spare_id} value={s.spare_id} disabled={s.quantity === 0}>
                                                        {s.spare_name} — {s.quantity} units avail
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Replacement Qty</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="form-input bg-slate-50 border-slate-100 font-black text-lg text-navy h-14 rounded-2xl shadow-sm"
                                                value={usageData.quantity}
                                                onChange={(e) => setUsageData({ ...usageData, quantity: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    </div>

                                    {/* Product Code Selection Grid */}
                                    {usageData.spare_id && (
                                        <div className="pt-6">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4 block">Select Available Product Codes ({selectedItemIds.length}/{usageData.quantity})</label>
                                            
                                            {loadingCodes ? (
                                                <div className="py-8 text-center text-slate-300 italic animate-pulse">Scanning Inventory...</div>
                                            ) : (
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                    {availableCodes.map(code => (
                                                        <button
                                                            key={code.item_id}
                                                            onClick={() => handleCodeToggle(code.item_id)}
                                                            className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group
                                                                ${selectedItemIds.includes(code.item_id) 
                                                                    ? 'bg-navy border-navy text-white shadow-xl' 
                                                                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'}
                                                            `}
                                                        >
                                                            <span className={`text-[8px] font-black uppercase mb-1 block ${selectedItemIds.includes(code.item_id) ? 'text-blue-300' : 'text-slate-400'}`}>Serial #</span>
                                                            <span className="font-black text-sm font-mono tracking-wider">{code.product_code}</span>
                                                            
                                                            {selectedItemIds.includes(code.item_id) && (
                                                                <div className="absolute right-2 top-2 bg-emerald-500 rounded-full p-1 border-2 border-navy">
                                                                    <Plus size={10} className="rotate-45" />
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))}
                                                    {availableCodes.length === 0 && <div className="col-span-full py-8 bg-red-50 text-red-400 rounded-2xl text-center font-bold text-xs border border-red-100 italic uppercase tracking-widest">Out of stock for this category</div>}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Form Section 2: Readings & Labor */}
                                <div className="space-y-8 pt-10 border-t border-slate-100">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-black">02</span>
                                        <h3 className="text-lg font-black text-navy uppercase tracking-tighter">Odometer & Engineering</h3>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-2 lg:col-span-1">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previous ODO</label>
                                            <input type="text" readOnly className="form-input bg-slate-50 border-none font-bold text-slate-400 cursor-not-allowed" value={usageData.old_reading} />
                                        </div>
                                        <div className="space-y-2 lg:col-span-1">
                                            <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Current ODO</label>
                                            <input 
                                                type="number" 
                                                className="form-input border-blue-100 font-black text-navy focus:border-blue-500 h-12" 
                                                placeholder="Enter KM"
                                                value={usageData.new_reading}
                                                onChange={(e) => setUsageData({...usageData, new_reading: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2 lg:col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mechanic / Service Engineer</label>
                                            <input 
                                                type="text" 
                                                className="form-input bg-slate-50 border-slate-100 font-bold text-navy h-12" 
                                                placeholder="Name"
                                                value={usageData.mechanic}
                                                onChange={(e) => setUsageData({...usageData, mechanic: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-blue-50/50 p-8 rounded-[2rem] border border-blue-50">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-navy uppercase tracking-widest">Parts Cost (₹)</label>
                                            <input 
                                                type="number" 
                                                className="form-input bg-white border-blue-100 font-bold text-xl h-14" 
                                                placeholder="0.00"
                                                value={usageData.parts_cost}
                                                onChange={(e) => setUsageData({...usageData, parts_cost: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-navy uppercase tracking-widest">Labor Service Charges (₹)</label>
                                            <input 
                                                type="number" 
                                                className="form-input bg-white border-blue-100 font-bold text-xl h-14" 
                                                placeholder="0.00"
                                                value={usageData.labor_charges}
                                                onChange={(e) => setUsageData({...usageData, labor_charges: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Date</label>
                                        <input 
                                            type="date" 
                                            className="form-input w-full md:w-64" 
                                            value={usageData.usage_date}
                                            onChange={(e) => setUsageData({...usageData, usage_date: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-10 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center">
                                <button onClick={() => setIsAddModalOpen(false)} className="px-10 py-4 font-black text-slate-400 uppercase text-xs tracking-widest hover:text-navy transition-colors">Abort Entry</button>
                                <button
                                    onClick={handleReplacementSubmit}
                                    disabled={!usageData.spare_id || selectedItemIds.length !== usageData.quantity || !usageData.new_reading || !usageData.mechanic}
                                    className={`px-16 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl
                                        ${!usageData.spare_id || selectedItemIds.length !== usageData.quantity || !usageData.new_reading || !usageData.mechanic
                                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                            : 'bg-navy text-white hover:scale-105 active:scale-95 shadow-navy/20'
                                        }
                                    `}
                                >
                                    Finalize Maintenance Entry
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
