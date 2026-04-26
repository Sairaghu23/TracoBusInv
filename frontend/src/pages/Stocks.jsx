import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, AlertCircle } from 'lucide-react';
import api from '../utils/api';

export default function Stocks() {
    const navigate = useNavigate();
    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [purchaseData, setPurchaseData] = useState({
        spare_id: '',
        purchase_date: new Date().toISOString().split('T')[0],
        amount: '',
        vendor: '',
        quantity: '',
        product_codes: []
    });

    const [newSpareName, setNewSpareName] = useState('');
    const [isNewTypeModalOpen, setIsNewTypeModalOpen] = useState(false);

    // Fetch Stocks
    const fetchStocks = async () => {
        setLoading(true);
        try {
            const result = await api.get('/api/spares/stocks');
            if (result.data?.status) {
                setStocks(result.data.data);
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

    const handleQuantityChange = (qty) => {
        const count = parseInt(qty) || 0;
        const codes = Array(count).fill('');
        setPurchaseData({ ...purchaseData, quantity: qty, product_codes: codes });
    };

    const handleCodeChange = (index, value) => {
        const newCodes = [...purchaseData.product_codes];
        newCodes[index] = value;
        setPurchaseData({ ...purchaseData, product_codes: newCodes });
    };

    const handlePurchaseSubmit = async () => {
        if (purchaseData.product_codes.some(c => !c.trim())) {
            alert("Please provide product codes for all units.");
            return;
        }
        try {
            const result = await api.post('/api/spares/purchases', purchaseData);
            if (result.data?.status) {
                alert("Purchase recorded and individual items registered!");
                setIsAddModalOpen(false);
                setPurchaseData({
                    spare_id: '',
                    purchase_date: new Date().toISOString().split('T')[0],
                    amount: '',
                    vendor: '',
                    quantity: '',
                    product_codes: []
                });
                fetchStocks();
            } else {
                alert(result.data?.message || "Operation failed");
            }
        } catch (err) {
            console.error("Error recording purchase:", err);
        }
    };

    const handleAddNewType = async () => {
        try {
            const result = await api.post('/api/spares/stocks', { spare_name: newSpareName });
            if (result.data?.status) {
                alert("New spare type added!");
                setIsNewTypeModalOpen(false);
                setNewSpareName('');
                fetchStocks();
            } else {
                alert(result.data?.message || "Operation failed");
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
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col md:flex-row max-h-[80vh]">
                        {/* Summary Column */}
                        <div className="p-6 bg-navy text-white w-full md:w-80 flex-shrink-0">
                            <h2 className="text-xl font-bold mb-2">Inventory Restock</h2>
                            <p className="text-blue-100 text-xs opacity-75 mb-6 italic">Record individual product codes for better tracking.</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1 block">Selected Category</label>
                                    <p className="font-bold text-lg">{stocks.find(s => s.spare_id === parseInt(purchaseData.spare_id))?.spare_name || 'Not Selected'}</p>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-blue-200 tracking-widest mb-1 block">Expected Units</label>
                                    <p className="font-black text-4xl italic">{purchaseData.quantity || 0}</p>
                                </div>
                            </div>
                        </div>

                        {/* Form Column */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-white">
                            <div className="p-8 overflow-y-auto space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-6">
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
                                    <div>
                                        <label className="form-label">Purchase Date</label>
                                        <input 
                                            type="date" 
                                            className="form-input" 
                                            value={purchaseData.purchase_date}
                                            onChange={(e) => setPurchaseData({...purchaseData, purchase_date: e.target.value})}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="form-label">Quantity (Units)</label>
                                        <input 
                                            type="number" 
                                            className="form-input font-bold" 
                                            placeholder="0" 
                                            value={purchaseData.quantity}
                                            onChange={(e) => handleQuantityChange(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label text-navy font-black">Total Invoice Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            className="form-input border-blue-200 bg-blue-50 font-bold"
                                            placeholder="0.00" 
                                            value={purchaseData.amount}
                                            onChange={(e) => setPurchaseData({...purchaseData, amount: e.target.value})}
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

                                {/* Dynamic Product Codes */}
                                {purchaseData.product_codes.length > 0 && (
                                    <div className="space-y-3 pt-6 border-t border-slate-100">
                                        <label className="text-xs font-black text-navy uppercase tracking-widest block mb-4">Enter Product Codes / Serial Numbers</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {purchaseData.product_codes.map((code, idx) => (
                                                <div key={idx} className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">#{idx + 1}</span>
                                                    <input 
                                                        type="text"
                                                        value={code}
                                                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                        className="form-input pl-10 text-xs font-bold uppercase"
                                                        placeholder="CODE"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
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
                </div>
            )}

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
                    </div>
                </div>
            )}
        </div>
    );
}
