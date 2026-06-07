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
        quantity: ''
    });

    // Fetch Stocks
    const fetchStocks = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/spares/stocks');
            if (res.data?.status) {
                setStocks(res.data.data);
            }
        } catch (err) {
            console.error("Error fetching stocks:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStocks();
    }, []);

    const handlePurchaseSubmit = async () => {
        try {
            const res = await api.post('/api/spares/purchases', purchaseData);
            if (res.data?.status) {
                alert("Purchase recorded successfully!");
                setIsAddModalOpen(false);
                fetchStocks();
            } else {
                alert(res.data?.message || "Failed to record purchase.");
            }
        } catch (err) {
            console.error("Error recording purchase:", err);
            alert("Error recording purchase: " + (err.response?.data?.message || err.message));
        }
    };

    const handleAddNewType = async () => {
        try {
            const res = await api.post('/api/spares/stocks', { spare_name: newSpareName });
            if (res.data?.status) {
                alert("New spare type added!");
                setIsNewTypeModalOpen(false);
                setNewSpareName('');
                fetchStocks();
            } else {
                alert(res.data?.message || "Failed to add new spare type.");
            }
        } catch (err) {
            console.error("Error adding spare type:", err);
            alert("Error adding spare type: " + (err.response?.data?.message || err.message));
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
                            </button>
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
