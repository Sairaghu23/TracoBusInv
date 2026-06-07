import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Plus, Settings, Calendar, User, 
    Search, X, Check, ArrowRight,
    Gauge, CreditCard, Trash2, Package, Hash
} from 'lucide-react';
import api from '../../../utils/api';

export default function BusSpares() {
    const { id: rc_plate_number } = useParams();
    const navigate = useNavigate();

    const [bus, setBus] = useState(null);
    const [sparesHistory, setSparesHistory] = useState([]);
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [availableItems, setAvailableItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    const [loadingItems, setLoadingItems] = useState(false);

    const [usageForm, setUsageForm] = useState({
        usage_date: new Date().toISOString().split('T')[0],
        mechanic: '',
        spare_cost: '',
        service_charge: '',
        old_reading: '',
        new_reading: ''
    });

    const [lastOdometer, setLastOdometer] = useState(0);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [busRes, historyRes, stocksRes] = await Promise.all([
                api.get(`/api/buses/${rc_plate_number}`),
                api.get(`/api/buses/${rc_plate_number}/spares`),
                api.get('/api/spares/stocks')
            ]);
            if (busRes.data?.status) setBus(busRes.data.data);
            if (historyRes.data?.status) {
                setSparesHistory(historyRes.data.data);
                const last = historyRes.data.data[0]?.new_reading || 0;
                setLastOdometer(last);
                setUsageForm(prev => ({ ...prev, old_reading: last }));
            }
            if (stocksRes.data?.status) setStocks(stocksRes.data.data);
        } catch (err) {
            console.error("Fetch error:", err);
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
                    className="w-full md:w-auto px-8 py-4 bg-navy text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-navy/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Plus size={18} className="text-emerald-400" /> Record Spare Usage
                </button>
            </div>

            {/* Metrics */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-navy rounded-3xl flex items-center justify-center text-white shadow-lg shadow-navy/20">
                        <CreditCard size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Expenditure</p>
                        <h3 className="text-4xl font-black text-navy italic">₹{totalExpenditure.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                        <Gauge size={28} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Odometer</p>
                        <h3 className="text-3xl font-black text-slate-700">{lastOdometer.toLocaleString()} <span className="text-sm italic opacity-50 uppercase">km</span></h3>
                    </div>
                </div>
                <div className="bg-navy p-8 rounded-[2.5rem] shadow-2xl shadow-navy/20 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Last Maintenance</p>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar size={18} className="text-blue-300" />
                        {sparesHistory.length > 0
                            ? new Date(sparesHistory[0].usage_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'No Record'}
                    </h3>
                </div>
            </section>

            {/* History Table */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Interval (KM)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Part</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Qty</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sparesHistory.map((record) => (
                                <tr key={record.usage_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <Calendar size={16} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy text-sm">{new Date(record.usage_date).toLocaleDateString()}</p>
                                                <p className="text-[10px] uppercase font-black text-slate-300">{record.mechanic}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black border border-emerald-100">
                                            {record.distance ? record.distance.toLocaleString() : 0} KM
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <p className="font-black text-navy uppercase text-sm">{record.spare_name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{record.product_codes || '—'}</p>
                                    </td>
                                    <td className="px-8 py-5 text-center font-black text-slate-700">{record.quantity}</td>
                                    <td className="px-8 py-5 text-right font-black text-lg text-navy pr-10">
                                        ₹{parseFloat(record.total_amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {sparesHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-28 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <Package size={44} strokeWidth={1} />
                                            <p className="font-black text-[10px] uppercase tracking-[0.3em]">No maintenance history</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* MODAL — Vertical single-column layout */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[2.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-300">

                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-navy uppercase tracking-tight">Record Spare Usage</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{bus?.rc_plate_number}</p>
                            </div>
                            <button onClick={resetModal} className="p-3 rounded-full hover:bg-red-50 hover:text-red-500 transition-all text-slate-400 border border-slate-100">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 custom-scrollbar">

                            {/* Step 1: Category */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spare Part Category</label>
                                <select
                                    className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 font-bold text-navy outline-none focus:border-navy transition-all"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">— Select Category —</option>
                                    {stocks.map(s => (
                                        <option key={s.spare_id} value={s.spare_id} disabled={s.quantity === 0}>
                                            {s.spare_name} ({s.quantity} available)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Step 2: Product Code Selection */}
                            {selectedCategory && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Product Codes</label>
                                        <span className="text-[10px] font-black text-navy bg-navy/5 px-3 py-1 rounded-full uppercase tracking-widest">
                                            {cart.length} selected
                                        </span>
                                    </div>

                                    {/* Search */}
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search codes..."
                                            className="w-full h-11 bg-slate-50 border-2 border-slate-100 rounded-xl pl-10 pr-4 font-bold text-navy text-sm outline-none focus:border-navy transition-all"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>

                                    {/* Codes Grid */}
                                    {loadingItems ? (
                                        <div className="flex items-center justify-center py-10 gap-3 text-slate-400">
                                            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-black uppercase tracking-widest">Loading inventory...</span>
                                        </div>
                                    ) : filteredItems.length === 0 ? (
                                        <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No available units</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                            {filteredItems.map(item => {
                                                const selected = cart.some(c => c.item_id === item.item_id);
                                                return (
                                                    <button
                                                        key={item.item_id}
                                                        onClick={() => toggleItem(item)}
                                                        className={`h-11 px-3 rounded-xl border-2 font-black text-xs font-mono uppercase transition-all flex items-center justify-between gap-2
                                                            ${selected
                                                                ? 'bg-navy border-navy text-white'
                                                                : 'bg-white border-slate-100 text-navy hover:border-navy'
                                                            }`}
                                                    >
                                                        <span className="truncate">{item.product_code}</span>
                                                        {selected && <Check size={12} strokeWidth={3} className="shrink-0" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Selected list */}
                                    {cart.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {cart.map(item => (
                                                <span
                                                    key={item.item_id}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-navy/5 border border-navy/10 rounded-lg text-[10px] font-black text-navy font-mono uppercase"
                                                >
                                                    {item.product_code}
                                                    <button onClick={() => toggleItem(item)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                        <X size={10} strokeWidth={3} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Divider */}
                            <div className="border-t border-slate-100" />

                            {/* Step 3: Technical Details */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technical Details</label>

                                {/* Odometer */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Previous Odometer</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-slate-600 outline-none focus:border-navy transition-all"
                                            value={usageForm.old_reading}
                                            onChange={(e) => setUsageForm({ ...usageForm, old_reading: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-1">Current Odometer *</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-white border-2 border-blue-100 rounded-xl px-4 font-black text-navy outline-none focus:border-blue-400 transition-all"
                                            value={usageForm.new_reading}
                                            onChange={(e) => setUsageForm({ ...usageForm, new_reading: e.target.value })}
                                            placeholder="Current KM"
                                        />
                                    </div>
                                </div>

                                {/* Mechanic */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Mechanic Name *</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Enter mechanic name"
                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl pl-11 pr-4 font-bold text-navy text-sm outline-none focus:border-navy transition-all"
                                            value={usageForm.mechanic}
                                            onChange={(e) => setUsageForm({ ...usageForm, mechanic: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Costs */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Parts Cost (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-black text-navy text-sm outline-none focus:border-navy transition-all"
                                            value={usageForm.spare_cost}
                                            onChange={(e) => setUsageForm({ ...usageForm, spare_cost: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Labor Charges (₹)</label>
                                        <input
                                            type="number"
                                            className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-black text-navy text-sm outline-none focus:border-navy transition-all"
                                            value={usageForm.service_charge}
                                            onChange={(e) => setUsageForm({ ...usageForm, service_charge: e.target.value })}
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Maintenance Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-xl px-4 font-bold text-navy outline-none focus:border-navy transition-all"
                                        value={usageForm.usage_date}
                                        onChange={(e) => setUsageForm({ ...usageForm, usage_date: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 shrink-0">
                            <div className="text-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Cost: </span>
                                <span className="font-black text-navy text-lg">
                                    ₹{(parseFloat(usageForm.spare_cost || 0) + parseFloat(usageForm.service_charge || 0)).toLocaleString()}
                                </span>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={resetModal} className="px-6 py-3 border-2 border-slate-200 rounded-2xl font-black text-xs text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all">
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmUsage}
                                    disabled={cart.length === 0 || !usageForm.new_reading || !usageForm.mechanic}
                                    className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2
                                        ${(cart.length === 0 || !usageForm.new_reading || !usageForm.mechanic)
                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            : 'bg-navy text-white hover:scale-105 active:scale-95 shadow-lg shadow-navy/20'}
                                    `}
                                >
                                    Save Record <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
