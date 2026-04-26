import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Package, Plus, Search, AlertCircle, ShoppingCart, 
    Calendar, User, CreditCard, ChevronRight, CheckCircle2, 
    X, Clipboard, Zap, Trash2, ArrowRight 
} from 'lucide-react';
import api from '../utils/api';

export default function Stocks() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newSpareName, setNewSpareName] = useState('');
    
    // Purchase Entry State
    const [purchaseData, setPurchaseData] = useState({
        spare_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        amount: '',
        vendor: '',
        quantity: 0,
        product_codes: []
    });

    const [isBulkMode, setIsBulkMode] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const codeInputsRef = useRef([]);

    const fetchStocks = async () => {
        setLoading(true);
        try {
            const result = await api.get('/api/spares/stocks');
            if (result.data?.status) setStocks(result.data.data);
        } catch (err) {
            console.error("Fetch failure:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStocks(); }, []);

    // Quantity Change Logic
    const handleQuantityChange = (val) => {
        const qty = parseInt(val) || 0;
        setPurchaseData(prev => {
            const newCodes = [...prev.product_codes];
            if (qty > newCodes.length) {
                for (let i = newCodes.length; i < qty; i++) newCodes.push('');
            } else {
                newCodes.splice(qty);
            }
            return { ...prev, quantity: qty, product_codes: newCodes };
        });
    };

    const handleCodeChange = (index, value) => {
        const newCodes = [...purchaseData.product_codes];
        newCodes[index] = value;
        setPurchaseData({ ...purchaseData, product_codes: newCodes });
    };

    const handleBulkPaste = (e) => {
        const text = e.target.value;
        setBulkInput(text);
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        setPurchaseData(prev => {
            const newCodes = [...prev.product_codes];
            lines.forEach((line, idx) => {
                if (idx < prev.quantity) newCodes[idx] = line.trim();
            });
            return { ...prev, product_codes: newCodes };
        });
    };

    const handlePurchaseSubmit = async () => {
        const hasEmpty = purchaseData.product_codes.some(c => !c.trim());
        const hasDuplicates = new Set(purchaseData.product_codes).size !== purchaseData.product_codes.length;

        if (hasEmpty) return alert("All product codes must be filled.");
        if (hasDuplicates) return alert("Duplicate product codes detected in this batch!");

        try {
            const res = await api.post('/api/spares/purchases', purchaseData);
            if (res.data?.status) {
                alert("Inventory updated successfully!");
                setIsAddModalOpen(false);
                setPurchaseData({
                    spare_id: '',
                    purchase_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    vendor: '',
                    quantity: 0,
                    product_codes: []
                });
                fetchStocks();
            }
        } catch (err) {
            console.error("Purchase error:", err);
            alert("Internal System Fault. Verification Failed.");
        }
    };

    const handleAddNewType = async () => {
        try {
            const res = await api.post('/api/spares/stocks', { spare_name: newSpareName });
            if (res.data?.status) {
                setIsNewTypeModalOpen(false);
                setNewSpareName('');
                fetchStocks();
            }
        } catch (err) { console.error(err); }
    };

    const filteredStocks = stocks.filter(s => s.spare_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const lowStockItems = stocks.filter(s => s.quantity < 5);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-navy border-t-transparent rounded-full animate-spin"></div>
                <p className="text-navy font-black uppercase tracking-widest text-xs">Syncing Inventory Index...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Premium Header */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-navy rounded-lg text-white">
                            <Package size={24} />
                        </div>
                        <h1 className="text-3xl font-black text-navy tracking-tight uppercase italic">Warehouse Registry</h1>
                    </div>
                    <p className="text-slate-500 font-medium">Enterprise Spare Parts Management & Lifecycle Tracking</p>
                </div>
                
                <div className="flex gap-4 w-full lg:w-auto">
                    <button 
                        onClick={() => setIsNewTypeModalOpen(true)}
                        className="flex-1 lg:flex-none px-6 py-3 bg-white border-2 border-slate-100 rounded-2xl font-bold text-navy hover:border-navy transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> New Category
                    </button>
                    <button 
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex-1 lg:flex-none px-8 py-3 bg-navy text-white rounded-2xl font-black shadow-xl shadow-navy/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Zap size={18} className="text-emerald-400 fill-emerald-400" /> Record Purchase
                    </button>
                </div>
            </header>

            {/* Smart Metrics Dashboard */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl hover:shadow-blue-50 transition-all duration-500">
                    <div className="w-16 h-16 bg-navy/5 rounded-2xl flex items-center justify-center text-navy group-hover:bg-navy group-hover:text-white transition-all">
                        <ShoppingCart size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total SKU Count</p>
                        <h3 className="text-4xl font-black text-navy">{stocks.length}</h3>
                    </div>
                </div>

                <div className={`p-8 rounded-[2rem] border transition-all duration-500 flex items-center gap-6 group
                    ${lowStockItems.length > 0 ? 'bg-red-50/50 border-red-100 hover:shadow-red-50 shadow-sm' : 'bg-emerald-50/50 border-emerald-100 shadow-sm'}
                `}>
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
                        ${lowStockItems.length > 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}
                    `}>
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${lowStockItems.length > 0 ? 'text-red-500' : 'text-emerald-600'}`}>Stock Health</p>
                        <h3 className="text-xl font-black text-slate-800">
                            {lowStockItems.length > 0 ? `${lowStockItems.length} Items Critically Low` : 'Optimal Inventory'}
                        </h3>
                    </div>
                </div>

                <div className="bg-navy p-8 rounded-[2rem] shadow-2xl shadow-navy/20 flex flex-col justify-center relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                        <Package size={140} />
                    </div>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-2">Live Registry Search</p>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" size={18} />
                        <input 
                            type="text" 
                            placeholder="Filter by name..." 
                            className="w-full bg-white/10 border-none h-14 rounded-2xl pl-12 text-white placeholder:text-blue-300/50 font-bold focus:ring-2 ring-blue-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Inventory Index Table */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serial Index</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Stock</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Activity</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStocks.map((stock) => (
                                <tr key={stock.spare_id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <span className="font-mono text-[11px] font-black text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">#SP-{stock.spare_id}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <p className="font-black text-navy text-lg group-hover:translate-x-1 transition-transform">{stock.spare_name}</p>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl font-black text-slate-700">{stock.quantity}</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Units in bin</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {stock.quantity < 5 ? (
                                            <span className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-tighter">
                                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Critical Restock
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-2 text-emerald-500 font-bold text-xs uppercase tracking-tighter">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => navigate(`/stocks/${stock.spare_id}/purchases`)}
                                            className="p-3 hover:bg-navy hover:text-white rounded-xl transition-all text-slate-400"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* MODAL: Purchase Entry Overhaul */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-navy/80 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row relative animate-in zoom-in-95 duration-500">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-8 z-10 p-3 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                            <X size={20} />
                        </button>

                        {/* Left Pane: Core Details */}
                        <div className="lg:w-1/3 bg-slate-50/50 p-10 border-r border-slate-100 flex flex-col justify-between overflow-y-auto">
                            <div className="space-y-10">
                                <div>
                                    <div className="w-16 h-16 bg-navy rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-navy/20">
                                        <Plus size={32} />
                                    </div>
                                    <h2 className="text-3xl font-black text-navy italic tracking-tighter">Stock Entry</h2>
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 leading-relaxed">Register new hardware units into primary warehouse bins.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Part Category</label>
                                        <select 
                                            className="w-full h-14 bg-white border-none rounded-2xl px-6 font-bold text-navy shadow-sm focus:ring-2 ring-navy/10 transition-all"
                                            value={purchaseData.spare_id}
                                            onChange={(e) => setPurchaseData({...purchaseData, spare_id: e.target.value})}
                                        >
                                            <option value="">-- Choose Category --</option>
                                            {stocks.map(s => <option key={s.spare_id} value={s.spare_id}>{s.spare_name}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Quantity</label>
                                            <input 
                                                type="number" 
                                                className="w-full h-14 bg-white border-none rounded-2xl px-6 font-black text-2xl text-navy shadow-sm ring-2 ring-navy/5"
                                                value={purchaseData.quantity}
                                                onChange={(e) => handleQuantityChange(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Invoice Amount</label>
                                            <input 
                                                type="number" 
                                                className="w-full h-14 bg-emerald-50/30 border-none rounded-2xl px-6 font-black text-navy placeholder:text-navy/20 shadow-sm"
                                                placeholder="₹"
                                                value={purchaseData.amount}
                                                onChange={(e) => setPurchaseData({...purchaseData, amount: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Vendor / Supplier</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input 
                                                type="text" 
                                                className="w-full h-14 bg-white border-none rounded-2xl pl-12 pr-6 font-bold text-navy shadow-sm"
                                                placeholder="e.g. Acme Auto Parts"
                                                value={purchaseData.vendor}
                                                onChange={(e) => setPurchaseData({...purchaseData, vendor: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Purchase Identity Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input 
                                                type="date" 
                                                className="w-full h-14 bg-white border-none rounded-2xl pl-12 pr-6 font-bold text-navy shadow-sm"
                                                value={purchaseData.purchase_date}
                                                onChange={(e) => setPurchaseData({...purchaseData, purchase_date: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handlePurchaseSubmit}
                                disabled={!purchaseData.spare_id || purchaseData.quantity <= 0 || !purchaseData.amount}
                                className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-3 mt-10
                                    ${(!purchaseData.spare_id || purchaseData.quantity <= 0 || !purchaseData.amount) 
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' 
                                        : 'bg-navy text-white hover:scale-105 shadow-navy/20 active:scale-95'}
                                `}
                            >
                                <ArrowRight size={18} /> Finalize Inventory Commit
                            </button>
                        </div>

                        {/* Right Pane: Code Management */}
                        <div className="flex-1 p-10 bg-white flex flex-col h-full overflow-hidden">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-navy uppercase tracking-tighter">Physical Identity Mapping</h3>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            {purchaseData.product_codes.filter(c => c.trim()).length} / {purchaseData.quantity} Codes Verified
                                        </p>
                                    </div>
                                </div>
                                <div className="flex bg-slate-100 p-1 rounded-2xl">
                                    <button 
                                        onClick={() => setIsBulkMode(false)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${!isBulkMode ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
                                    >Individual</button>
                                    <button 
                                        onClick={() => setIsBulkMode(true)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${isBulkMode ? 'bg-white text-navy shadow-sm' : 'text-slate-500'}`}
                                    >Bulk Paste</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {purchaseData.quantity === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-50">
                                        <div className="w-24 h-24 border-4 border-dashed border-slate-200 rounded-full flex items-center justify-center">
                                            <Package size={40} />
                                        </div>
                                        <p className="font-black uppercase tracking-[0.2em] text-[10px]">Awaiting Quantity Input...</p>
                                    </div>
                                ) : isBulkMode ? (
                                    <div className="h-full flex flex-col gap-4 animate-in slide-in-from-right-4 duration-300">
                                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-4">
                                            <Clipboard className="text-blue-500 mt-1" size={20} />
                                            <div>
                                                <p className="text-sm font-bold text-navy">Bulk Inject Mode</p>
                                                <p className="text-xs text-slate-500 mt-1">Paste your list of serial numbers (one per line). The system will automatically map them to the corresponding unit slots.</p>
                                            </div>
                                        </div>
                                        <textarea
                                            className="flex-1 w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 font-mono text-sm font-bold focus:ring-4 ring-navy/5 focus:bg-white transition-all outline-none"
                                            placeholder={"Serial001\nSerial002\nSerial003..."}
                                            value={bulkInput}
                                            onChange={handleBulkPaste}
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-left-4 duration-300 pb-10">
                                        {purchaseData.product_codes.map((code, idx) => {
                                            const isDuplicate = purchaseData.product_codes.filter(c => c === code && c !== '').length > 1;
                                            return (
                                                <div key={idx} className={`group flex items-center gap-4 p-4 rounded-3xl border transition-all duration-300
                                                    ${isDuplicate ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-50 hover:border-navy hover:bg-white'}
                                                `}>
                                                    <span className="w-10 h-10 flex-shrink-0 bg-white rounded-2xl flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:text-navy group-hover:scale-110 transition-all shadow-sm">
                                                        {idx + 1}
                                                    </span>
                                                    <input 
                                                        type="text"
                                                        value={code}
                                                        placeholder="S-NO / CODE"
                                                        className="bg-transparent border-none w-full p-0 font-black text-navy uppercase placeholder:text-slate-200 text-sm focus:ring-0"
                                                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && idx < purchaseData.quantity - 1) {
                                                                codeInputsRef.current[idx + 1].focus();
                                                            }
                                                        }}
                                                        ref={el => codeInputsRef.current[idx] = el}
                                                    />
                                                    {code.trim() && !isDuplicate && <CheckCircle2 size={16} className="text-emerald-500" />}
                                                    {isDuplicate && <AlertCircle size={16} className="text-red-500 animate-bounce" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Status Bar */}
                            <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center bg-white">
                                <div className="flex gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entry Progress</span>
                                        <span className="text-xl font-black text-navy italic">{Math.round((purchaseData.product_codes.filter(c => c.trim()).length / purchaseData.quantity) * 100 || 0)}%</span>
                                    </div>
                                    <div className="w-[120px] h-3 bg-slate-100 rounded-full mt-auto mb-1 overflow-hidden">
                                        <div 
                                            className="h-full bg-navy transition-all duration-700 ease-out" 
                                            style={{ width: `${(purchaseData.product_codes.filter(c => c.trim()).length / purchaseData.quantity) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPurchaseData({...purchaseData, product_codes: Array(purchaseData.quantity).fill('')})}
                                    className="px-6 py-3 text-red-500 font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-red-50 rounded-2xl transition-all"
                                >
                                    <Trash2 size={14} /> Clear Codes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: New Category (Mini) */}
            {isNewTypeModalOpen && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-navy italic tracking-tighter">Add Category</h3>
                            <button onClick={() => setIsNewTypeModalOpen(false)} className="text-slate-300 hover:text-navy transition-colors"><X size={20} /></button>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Initialize a new part classification in the master log.</p>
                        <input 
                            type="text" 
                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-6 font-bold text-navy shadow-inner mb-6"
                            placeholder="e.g. Rear Spring"
                            value={newSpareName}
                            onChange={(e) => setNewSpareName(e.target.value)}
                        />
                        <button 
                            onClick={handleAddNewType}
                            disabled={!newSpareName.trim()}
                            className="w-full py-4 bg-navy text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-navy/20 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                        >
                            Register New Classification
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
