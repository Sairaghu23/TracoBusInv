<<<<<<< HEAD
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Package, Plus, Search, AlertCircle, ShoppingCart, 
    Calendar, User, CreditCard, ChevronRight, CheckCircle2, 
    X, Clipboard, Zap, Trash2, ArrowRight 
} from 'lucide-react';
import api from '../utils/api';
=======
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, AlertCircle } from 'lucide-react';
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)

export default function Stocks() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
<<<<<<< HEAD
    const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newSpareName, setNewSpareName] = useState('');
    
    // Purchase Entry State
=======
    const [searchTerm, setSearchTerm] = useState('');
    
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
    const [purchaseData, setPurchaseData] = useState({
        spare_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        amount: '',
        vendor: '',
<<<<<<< HEAD
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
=======
        quantity: ''
    });

    const [newSpareName, setNewSpareName] = useState('');
    const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);

    // Fetch Stocks
    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:5001/api/spares/stocks');
            const result = await res.json();
            if (result.status) {
                setStocks(result.data);
            }
        } catch (err) {
            console.error("Error fetching stocks:", err);
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        } finally {
            setLoading(false);
        }
    };

<<<<<<< HEAD
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
=======
    useEffect(() => {
        fetchStocks();
    }, []);

    const handlePurchaseSubmit = async () => {
        try {
            const res = await fetch('http://localhost:5001/api/spares/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData)
            });
            const result = await res.json();
            if (result.status) {
                alert("Purchase recorded successfully!");
                setIsAddModalOpen(false);
                fetchStocks();
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error("Error recording purchase:", err);
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
        }
    };

    const handleAddNewType = async () => {
        try {
<<<<<<< HEAD
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
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Minimal Header */}
            <header className="text-center space-y-2">
                <div className="inline-flex p-3 bg-navy text-white rounded-2xl shadow-xl shadow-navy/20 mb-4">
                    <Package size={28} />
                </div>
                <h1 className="text-4xl font-black text-navy tracking-tight uppercase italic">Inventory Registry</h1>
                <p className="text-slate-400 font-medium tracking-wide border-t border-slate-100 pt-4 inline-block px-8 text-xs uppercase">Master Stock Control Center</p>
            </header>

            {/* Main Action Area */}
            <div className="flex justify-center gap-4">
                <button 
                    onClick={() => setIsNewTypeModalOpen(true)}
                    className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-navy hover:border-navy transition-all flex items-center gap-2 text-sm shadow-sm"
                >
                    <Plus size={16} /> New Category
                </button>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="px-10 py-3 bg-navy text-white rounded-2xl font-black shadow-xl shadow-navy/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-sm"
                >
                    <Zap size={16} className="text-emerald-400 fill-emerald-400" /> Record Entry
                </button>
            </div>

            {/* Centered Desktop Table */}
            <section className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex items-center gap-4">
                    <Search className="text-slate-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search assets..." 
                        className="flex-1 bg-transparent border-none font-bold text-navy placeholder:text-slate-200 focus:ring-0"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Part classification</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Avail. Units</th>
                                <th className="px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Log</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStocks.map((stock) => (
                                <tr key={stock.spare_id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="font-black text-navy text-base uppercase">{stock.spare_name}</span>
                                            <span className="font-mono text-[9px] font-black text-slate-300 uppercase mt-0.5 tracking-tighter">ID: #SP-{stock.spare_id}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase
                                            ${stock.quantity < 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}
                                        `}>
                                            {stock.quantity} Unit{stock.quantity !== 1 ? 's' : ''}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => navigate(`/stocks/${stock.spare_id}/purchases`)}
                                            className="p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-navy hover:text-white transition-all shadow-sm"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* MODAL: Minimal Elegant Form */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-navy/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-2xl max-h-[92vh] flex flex-col rounded-[3rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 duration-500 border border-white/20">
                        <div className="p-10 pb-4 flex justify-between items-start shrink-0">
                            <div>
                                <h2 className="text-3xl font-black text-navy italic tracking-tighter uppercase">New Stock Entry</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Initialize hardware tokens in ledger</p>
                            </div>
                            <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-50 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 pt-0 space-y-10 custom-scrollbar">
                            <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                                {/* Selection Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Hardware Category</label>
                                        <select 
                                            className="w-full h-12 bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 font-bold text-navy focus:border-navy focus:bg-white transition-all outline-none"
                                            value={purchaseData.spare_id}
                                            onChange={(e) => setPurchaseData({...purchaseData, spare_id: e.target.value})}
                                        >
                                            <option value="">-- Choose Category --</option>
                                            {stocks.map(s => <option key={s.spare_id} value={s.spare_id}>{s.spare_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Registering Date</label>
                                        <input 
                                            type="date" 
                                            className="w-full h-12 bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 font-bold text-navy focus:border-navy focus:bg-white transition-all outline-none"
                                            value={purchaseData.purchase_date}
                                            onChange={(e) => setPurchaseData({...purchaseData, purchase_date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Unit Count</label>
                                        <input 
                                            type="number" 
                                            className="w-full h-12 bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 font-black text-xl text-navy focus:border-navy focus:bg-white transition-all outline-none"
                                            value={purchaseData.quantity}
                                            onChange={(e) => handleQuantityChange(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2 lg:col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Supplier / Vendor Alias</label>
                                        <input 
                                            type="text" 
                                            className="w-full h-12 bg-slate-50/50 border-2 border-slate-100 rounded-2xl px-5 font-bold text-navy focus:border-navy focus:bg-white transition-all outline-none"
                                            placeholder="Trading House Name"
                                            value={purchaseData.vendor}
                                            onChange={(e) => setPurchaseData({...purchaseData, vendor: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Final Invoice Amount (₹)</label>
                                    <div className="relative">
                                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                        <input 
                                            type="number" 
                                            className="w-full h-14 bg-emerald-50/30 border-2 border-emerald-100/50 rounded-2xl pl-12 pr-6 font-black text-2xl text-navy placeholder:opacity-20 outline-none"
                                            placeholder="0.00"
                                            value={purchaseData.amount}
                                            onChange={(e) => setPurchaseData({...purchaseData, amount: e.target.value})}
                                        />
                                    </div>
                                </div>

                                {/* Intelligent Code Mapper */}
                                <div className="space-y-4 pt-6 border-t border-slate-50">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-navy uppercase tracking-widest">Physical Token Map</label>
                                        <button 
                                            onClick={() => setIsBulkMode(!isBulkMode)}
                                            className="text-[9px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-lg hover:bg-navy hover:text-white transition-all"
                                        >
                                            Switch to {isBulkMode ? "Individual" : "Bulk Paste"}
                                        </button>
                                    </div>

                                    <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                        {purchaseData.quantity === 0 ? (
                                            <div className="py-10 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Awaiting Quantity Definition</p>
                                            </div>
                                        ) : isBulkMode ? (
                                            <textarea
                                                className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-2xl p-5 font-mono text-xs font-bold focus:bg-white transition-all outline-none"
                                                placeholder={"PASTE LIST HERE\nITEM001\nITEM002..."}
                                                value={bulkInput}
                                                onChange={handleBulkPaste}
                                            />
                                        ) : (
                                            <div className="grid grid-cols-2 gap-3 pb-4">
                                                {purchaseData.product_codes.map((code, idx) => {
                                                    const isDuplicate = purchaseData.product_codes.filter(c => c === code && c !== '').length > 1;
                                                    return (
                                                        <input 
                                                            key={idx}
                                                            type="text"
                                                            className={`h-10 px-4 rounded-xl text-xs font-black uppercase text-navy border-2 outline-none
                                                                ${isDuplicate ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-50 focus:border-navy'}
                                                            `}
                                                            placeholder={`ID #${idx + 1}`}
                                                            value={code}
                                                            onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-10 pt-4 bg-slate-50/50 border-t border-slate-100 shrink-0">
                            <button
                                onClick={handlePurchaseSubmit}
                                disabled={!purchaseData.spare_id || purchaseData.quantity <= 0 || !purchaseData.amount}
                                className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.3em] transition-all shadow-xl flex items-center justify-center gap-3
                                    ${(!purchaseData.spare_id || purchaseData.quantity <= 0 || !purchaseData.amount) 
                                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                                        : 'bg-navy text-white hover:scale-105 shadow-navy/20 active:scale-95'}
                                `}
                            >
                                Confirm & Dispatch Load <ArrowRight size={18} />
=======
            const res = await fetch('http://localhost:5001/api/spares/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ spare_name: newSpareName })
            });
            const result = await res.json();
            if (result.status) {
                alert("New spare type added!");
                setIsNewTypeModalOpen(false);
                setNewSpareName('');
                fetchStocks();
            } else {
                alert(result.message);
            }
        } catch (err) {
            console.error("Error adding spare type:", err);
        }
    };

    const filteredStocks = stocks.filter(s => 
        s.spare_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const lowStockCount = stocks.filter(s => s.quantity < 10).length;

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"></div></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                    <Package className="text-emerald-500" /> 
                    Global Inventory Stocks
                </h1>
                <div className="flex gap-3">
                    <button onClick={() => setIsNewTypeModalOpen(true)} className="btn btn-outline">
                        Register New Part Type
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
                        <Plus size={18} /> Record Purchase
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card flex items-center gap-6 border-l-4 border-l-emerald-500 bg-emerald-50">
                    <div className="p-4 bg-white rounded-xl shadow-sm text-emerald-600">
                        <Package size={32} />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider mb-1">Total Unique Part Categories</p>
                        <h2 className="text-3xl font-bold text-slate-800">{stocks.length}</h2>
                    </div>
                </div>

                <div className={`card flex flex-col justify-center border-l-4 ${lowStockCount > 0 ? 'border-l-red-500 bg-red-50' : 'border-l-blue-500 bg-blue-50'}`}>
                    <p className={`text-sm font-semibold uppercase tracking-wider mb-1 ${lowStockCount > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {lowStockCount > 0 ? 'Attention Required' : 'Inventory Healthy'}
                    </p>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        {lowStockCount > 0 ? `${lowStockCount} items critically low on stock` : 'All items sufficiently stocked'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Maintenance threshold: 10 units</p>
                </div>
            </div>

            {/* Controls */}
            <div className="card flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input pl-10" 
                        placeholder="Search spare parts inventory..."
                    />
                </div>
            </div>

            {/* Table */}
            <div className="table-container shadow-md rounded-xl overflow-hidden">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Spare Part Name</th>
                            <th>Available Quantity</th>
                            <th className="text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredStocks.map((stock) => (
                            <tr key={stock.spare_id} className="hover:bg-slate-50">
                                <td className="font-mono text-slate-400 text-xs">#SP-{stock.spare_id}</td>
                                <td className="font-semibold text-navy">{stock.spare_name}</td>
                                <td>
                                    <span className={`px-4 py-1.5 rounded-full font-black text-sm border
                                        ${stock.quantity < 10 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}
                                    `}>
                                        {stock.quantity} Units
                                    </span>
                                </td>
                                <td className="text-right">
                                    <button 
                                        onClick={() => navigate(`/stocks/${stock.spare_id}/purchases`)}
                                        className="text-blue-600 hover:text-blue-800 text-sm font-bold"
                                    >
                                        Purchase Logs
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* New Purchase Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 bg-navy text-white">
                            <h2 className="text-xl font-bold">Record Cargo Stock Purchase</h2>
                            <p className="text-blue-100 text-xs opacity-75">Update inventory after supply arrival.</p>
                        </div>
                        <div className="p-8 space-y-4">
                            <div>
                                <label className="form-label">Part Classification</label>
                                <select 
                                    className="form-input"
                                    value={purchaseData.spare_id}
                                    onChange={(e) => setPurchaseData({...purchaseData, spare_id: e.target.value})}
                                >
                                    <option value="">-- Select Spare Type --</option>
                                    {stocks.map(s => <option key={s.spare_id} value={s.spare_id}>{s.spare_name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Purchase Date</label>
                                    <input 
                                        type="date" 
                                        className="form-input" 
                                        value={purchaseData.purchase_date}
                                        onChange={(e) => setPurchaseData({...purchaseData, purchase_date: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Quantity (Units)</label>
                                    <input 
                                        type="number" 
                                        className="form-input font-bold" 
                                        placeholder="0" 
                                        value={purchaseData.quantity}
                                        onChange={(e) => setPurchaseData({...purchaseData, quantity: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Supplier / Vendor</label>
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    placeholder="e.g. City Auto Distribution" 
                                    value={purchaseData.vendor}
                                    onChange={(e) => setPurchaseData({...purchaseData, vendor: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="form-label text-navy font-black">Total Invoice Amount (₹)</label>
                                <input 
                                    type="number" 
                                    className="form-input border-blue-200 bg-blue-50 font-black text-blue-800"
                                    placeholder="0.00" 
                                    value={purchaseData.amount}
                                    onChange={(e) => setPurchaseData({...purchaseData, amount: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-6 pt-0 border-t border-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 font-bold text-slate-400">Cancel</button>
                            <button 
                                onClick={handlePurchaseSubmit} 
                                className="btn btn-primary px-8"
                                disabled={!purchaseData.spare_id || !purchaseData.quantity || !purchaseData.amount}
                            >
                                Confirm Purchase
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                            </button>
                        </div>
                    </div>
                </div>
            )}

<<<<<<< HEAD
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
=======
            {/* New Part Type Modal */}
            {isNewTypeModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                                <Plus size={24} className="text-emerald-500" />
                                Register New Spare Type
                            </h2>
                        </div>
                        <div className="p-6 pt-0 space-y-4">
                            <p className="text-sm text-slate-500">Add a new category of parts to the master inventory database.</p>
                            <input 
                                type="text" 
                                className="form-input focus:border-emerald-500" 
                                placeholder="e.g. Engine Oil Filter"
                                value={newSpareName}
                                onChange={(e) => setNewSpareName(e.target.value)}
                            />
                        </div>
                        <div className="p-6 bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setIsNewTypeModalOpen(false)} className="px-4 py-2 font-bold text-slate-400">Cancel</button>
                            <button 
                                onClick={handleAddNewType} 
                                className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                                disabled={!newSpareName}
                            >
                                Register Type
                            </button>
                        </div>
>>>>>>> ebd537dc (fixed fuel entry issue in the deisel section)
                    </div>
                </div>
            )}
        </div>
    );
}
