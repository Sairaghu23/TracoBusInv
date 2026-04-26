import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ChevronLeft, Plus, Settings, Calendar, User, 
    ShoppingBag, Search, X, Check, ArrowRight,
    Wrench, Gauge, CreditCard, Trash2, CheckCircle2, Package
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
    
    // Cart-based Selection State
    const [selectedCategory, setSelectedCategory] = useState('');
    const [availableItems, setAvailableItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    
    const [usageForm, setUsageForm] = useState({
        usage_date: new Date().toISOString().split('T')[0],
        mechanic: '',
        spare_cost: '',
        service_charge: '',
        old_reading: '',
        new_reading: ''
    });

    const [lastOdometer, setLastOdometer] = useState(0);
    const [loadingItems, setLoadingItems] = useState(false);

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
            console.error("Master Sync Failure:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableItems = async (spareId) => {
        if (!spareId) return;
        setLoadingItems(true);
        try {
            const res = await api.get(`/api/spares/inventory/${spareId}?status=AVAILABLE`);
            if (res.data?.status) setAvailableItems(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingItems(false);
        }
    };

    useEffect(() => { fetchData(); }, [rc_plate_number]);

    useEffect(() => {
        if (selectedCategory) fetchAvailableItems(selectedCategory);
    }, [selectedCategory]);

    const addToCart = (item) => {
        if (cart.find(c => c.item_id === item.item_id)) return;
        setCart([...cart, item]);
    };

    const removeFromCart = (itemId) => {
        setCart(cart.filter(item => item.item_id !== itemId));
    };

    const handleConfirmUsage = async () => {
        if (cart.length === 0) return alert("Select at least one hardware unit.");
        if (!usageForm.new_reading || !usageForm.mechanic) return alert("Complete the technical details first.");

        try {
            // Payload needs to match model: rc_plate_number, spare_id, item_ids, quantity, etc.
            const payload = {
                ...usageForm,
                rc_plate_number,
                spare_id: selectedCategory,
                item_ids: cart.map(i => i.item_id),
                quantity: cart.length
            };

            const res = await api.post(`/api/buses/${rc_plate_number}/spares`, payload);
            if (res.data?.status) {
                alert("Replacement workflow finalized!");
                setIsAddModalOpen(false);
                setCart([]);
                setSelectedCategory('');
                fetchData();
            }
        } catch (err) {
            console.error(err);
            alert("Workflow Fault: Schema Mismatch or Network Issue.");
        }
    };

    const filteredItems = availableItems.filter(i => i.product_code.toLowerCase().includes(searchQuery.toLowerCase()));
    const totalExpenditure = sparesHistory.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-[1440px] mx-auto p-6 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/buses/${rc_plate_number}`)} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 text-slate-400 transition-all">
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-black text-navy italic tracking-tighter uppercase">{bus?.rc_plate_number || 'Vehicle'} <span className="text-slate-300 not-italic ml-2">/ Maintenance Hub</span></h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Lifecycle monitoring for spare part replacements</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="w-full md:w-auto px-8 py-4 bg-navy text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-navy/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Plus size={18} className="text-emerald-400" /> Start Replacement Workflow
                </button>
            </div>

            {/* Quick Metrics */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-navy rounded-3xl flex items-center justify-center text-white shadow-lg shadow-navy/20">
                        <ShoppingBag size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Lifetime Expenditure</p>
                        <h3 className="text-4xl font-black text-navy italic">₹{totalExpenditure.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center">
                        <Gauge size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Odometer</p>
                        <h3 className="text-3xl font-black text-slate-700">{lastOdometer.toLocaleString()} <span className="text-sm italic opacity-50 uppercase tracking-normal">km</span></h3>
                    </div>
                </div>
                <div className="bg-navy p-8 rounded-[2.5rem] shadow-2xl shadow-navy/20 flex flex-col justify-center">
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Last Maintenance Event</p>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Calendar size={18} className="text-blue-300" />
                        {sparesHistory.length > 0 ? new Date(sparesHistory[0].usage_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Record'}
                    </h3>
                </div>
            </section>

            {/* Replacement History Table */}
            <section className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entry Date</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Interval (KM)</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Part classification</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Items</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Impact Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 italic">
                            {sparesHistory.map((record) => (
                                <tr key={record.usage_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3 not-italic">
                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <Calendar size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-navy">{new Date(record.usage_date).toLocaleDateString()}</p>
                                                <p className="text-[10px] uppercase font-black text-slate-300">{record.mechanic}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-black not-italic border border-emerald-100">
                                            {record.distance ? record.distance.toLocaleString() : 0} KM
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="not-italic">
                                            <p className="font-black text-navy uppercase">{record.spare_name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-1">S/N: {record.product_codes || 'NO_ID_MAPPED'}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="font-black text-slate-700 not-italic">{record.quantity}</span>
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-lg text-navy not-italic pr-12">
                                        ₹{parseFloat(record.total_amount || 0).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                            {sparesHistory.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-3 text-slate-300">
                                            <Package size={48} strokeWidth={1} />
                                            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Operational Vacuum: No History</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* AMAZON CART STYLE MODAL OVERHAUL */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-navy/80 backdrop-blur-2xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-[1200px] h-[92vh] rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-500 border border-white/20">
                        {/* Header Modal */}
                        <div className="px-10 py-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-navy rounded-2xl text-white shadow-lg shadow-navy/20">
                                    <ShoppingCart size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-navy italic tracking-tighter uppercase">Service Cart Workflow</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase tracking-widest">{bus?.rc_plate_number}</span>
                                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">Active Draft</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm border border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* LEFT SIDE: AVAILABLE ITEMS BROWSER */}
                            <div className="flex-1 flex flex-col border-r border-slate-100 bg-white">
                                <div className="p-8 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Select Hardware Category</label>
                                            <select 
                                                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-navy shadow-inner focus:ring-2 ring-navy/10 transition-all outline-none"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="">-- Choose Part Category --</option>
                                                {stocks.map(s => (
                                                    <option key={s.spare_id} value={s.spare_id} disabled={s.quantity === 0}>
                                                        {s.spare_name} ({s.quantity} Avail)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Search Product Codes</label>
                                            <div className="relative">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Filter serials..." 
                                                    className="w-full h-14 bg-slate-50 border-none rounded-2xl pl-12 pr-6 font-bold text-navy shadow-inner outline-none"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto px-8 pb-10">
                                    {!selectedCategory ? (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                                            <Package size={64} strokeWidth={1} />
                                            <p className="font-black uppercase tracking-[0.2em] text-[10px]">Select Category to Browse Units</p>
                                        </div>
                                    ) : loadingItems ? (
                                        <div className="flex flex-col items-center justify-center h-48 gap-4">
                                            <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying Warehouse Index...</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                                            {filteredItems.map(item => {
                                                const isInCart = cart.some(c => c.item_id === item.item_id);
                                                return (
                                                    <button 
                                                        key={item.item_id}
                                                        onClick={() => isInCart ? removeFromCart(item.item_id) : addToCart(item)}
                                                        className={`group relative p-6 rounded-3xl border-2 transition-all duration-500 text-left overflow-hidden
                                                            ${isInCart 
                                                                ? 'bg-navy border-navy text-white shadow-xl scale-[0.98]' 
                                                                : 'bg-white border-slate-100 hover:border-navy text-navy hover:-translate-y-1'}
                                                        `}
                                                    >
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-4 transition-all
                                                            ${isInCart ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-navy/5 group-hover:text-navy'}
                                                        `}>
                                                            <Package size={16} />
                                                        </div>
                                                        <p className={`text-[9px] font-black uppercase mb-1 ${isInCart ? 'text-blue-300' : 'text-slate-400'}`}>Unit Identity</p>
                                                        <h4 className="font-black text-lg tracking-tight font-mono">{item.product_code}</h4>
                                                        
                                                        {isInCart && (
                                                            <div className="absolute right-4 top-4 bg-emerald-500 rounded-full p-1 border-2 border-navy">
                                                                <Check size={12} strokeWidth={4} />
                                                            </div>
                                                        )}
                                                        
                                                        {!isInCart && (
                                                            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                                                <Plus size={16} className="text-navy" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                            {filteredItems.length === 0 && (
                                                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest italic">Inventory Depleted or No Matching Serial</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT SIDE: SELECTED CART & USAGE FORM */}
                            <div className="w-[450px] flex flex-col bg-slate-50/50 h-full overflow-hidden">
                                <div className="p-8 flex-1 overflow-y-auto space-y-10">
                                    {/* Cart Section */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-lg font-black text-navy uppercase tracking-tighter flex items-center gap-2">
                                                <ShoppingCart size={20} className="text-emerald-500" /> Service Cart
                                            </h3>
                                            <span className="px-4 py-1 bg-navy text-white text-[10px] font-black rounded-full uppercase tracking-widest">{cart.length} Selected</span>
                                        </div>

                                        <div className="space-y-2 min-h-[100px]">
                                            {cart.map(item => (
                                                <div key={item.item_id} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-right-4 duration-300">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                                                            <CheckCircle2 size={14} />
                                                        </div>
                                                        <span className="font-mono text-sm font-bold text-navy uppercase">{item.product_code}</span>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.item_id)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {cart.length === 0 && (
                                                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] py-12 flex flex-col items-center justify-center text-slate-300 gap-3">
                                                    <ShoppingCart size={32} strokeWidth={1} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting Hardware Selection</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tech Data Form */}
                                    <div className="space-y-6 pt-10 border-t border-slate-200">
                                        <h3 className="text-lg font-black text-navy uppercase tracking-tighter flex items-center gap-2">
                                            <Settings size={20} className="text-blue-500" /> Engineering Protocol
                                        </h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Previous ODO</label>
                                                <input disabled className="w-full h-12 bg-white/50 border border-slate-100 rounded-xl px-4 font-bold text-slate-400" value={usageForm.old_reading} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-blue-500 uppercase tracking-widest px-2">Current ODO (New)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full h-12 bg-white border border-blue-100 rounded-xl px-4 font-black text-navy focus:ring-2 ring-blue-100 outline-none transition-all"
                                                    value={usageForm.new_reading}
                                                    onChange={(e) => setUsageForm({...usageForm, new_reading: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Mechanic / Service Charge Point</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                                <input 
                                                    type="text" 
                                                    placeholder="Assigned Mechanic" 
                                                    className="w-full h-12 bg-white border border-slate-100 rounded-xl pl-10 pr-4 font-black text-navy text-xs"
                                                    value={usageForm.mechanic}
                                                    onChange={(e) => setUsageForm({...usageForm, mechanic: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Parts Cost (₹)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 font-black text-navy text-sm"
                                                    value={usageForm.spare_cost}
                                                    onChange={(e) => setUsageForm({...usageForm, spare_cost: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Labor Charges (₹)</label>
                                                <input 
                                                    type="number" 
                                                    className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 font-black text-navy text-sm"
                                                    value={usageForm.service_charge}
                                                    onChange={(e) => setUsageForm({...usageForm, service_charge: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">Maintenance Date</label>
                                            <input 
                                                type="date" 
                                                className="w-full h-12 bg-white border border-slate-100 rounded-xl px-4 font-bold text-navy"
                                                value={usageForm.usage_date}
                                                onChange={(e) => setUsageForm({...usageForm, usage_date: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Summary & Actions */}
                                <div className="p-8 bg-sky-950 text-white flex flex-col gap-6">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 opacity-60">Impact Valuation</p>
                                            <h4 className="text-4xl font-black italic">₹{(parseFloat(usageForm.spare_cost || 0) + parseFloat(usageForm.service_charge || 0)).toLocaleString()}</h4>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-blue-300 opacity-60">Estimated KM Delta</p>
                                            <p className="text-2xl font-black italic">{(usageForm.new_reading - lastOdometer) || 0} <span className="text-xs opacity-40 uppercase not-italic ml-1">km</span></p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleConfirmUsage}
                                        disabled={cart.length === 0 || !usageForm.new_reading || !usageForm.mechanic}
                                        className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3
                                            ${(cart.length === 0 || !usageForm.new_reading || !usageForm.mechanic)
                                                ? 'bg-white/10 text-white/30 cursor-not-allowed'
                                                : 'bg-emerald-500 text-white hover:scale-105 active:scale-95 shadow-xl shadow-emerald-500/20'}
                                        `}
                                    >
                                        Finalize Registry Commit <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
