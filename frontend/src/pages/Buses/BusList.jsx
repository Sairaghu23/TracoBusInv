import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, LayoutGrid, List, MoreVertical, Edit2, Trash2, Bus, AlertTriangle, X, CheckCircle2, MoreHorizontal } from 'lucide-react';
import api from '../../utils/api';

export default function BusList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [searchField, setSearchField] = useState('rc_plate_number');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [loadingBuses, setLoadingBuses] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [newBusData, setNewBusData] = useState({
        bus_no: '',
        rc_plate_number: '',
        seating_capacity: '',
        engine_number: '',
        route_id: '',
        purchase_date: '',
        status: 'ACTIVE'
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewBusData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setNewBusData({
            bus_no: '',
            rc_plate_number: '',
            seating_capacity: '',
            engine_number: '',
            route_id: '',
            purchase_date: '',
            status: 'ACTIVE'
        });
        setIsEditMode(false);
        setIsAddModalOpen(false);
    };

    const fetchBuses = async () => {
        setLoadingBuses(true);
        try {
            const result = await api.get('/api/buses');
            if (result.data?.status) {
                setBuses(result.data.data);
            }
        } catch (error) {
            console.error("Error fetching buses:", error);
        } finally {
            setLoadingBuses(false);
        }
    };

    const handleEdit = (bus) => {
        setNewBusData({
            bus_no: bus.bus_no || '',
            rc_plate_number: bus.rc_plate_number,
            seating_capacity: bus.seating_capacity,
            engine_number: bus.engine_number,
            route_id: bus.route_id || '',
            purchase_date: bus.purchase_date ? bus.purchase_date.split('T')[0] : '',
            status: bus.status?.toUpperCase() || 'ACTIVE'
        });
        setIsEditMode(true);
        setIsAddModalOpen(true);
    };

    const handleDelete = async (rc_plate_number) => {
        if (window.confirm(`Are you sure you want to delete bus ${rc_plate_number}?`)) {
            try {
                const result = await api.delete(`/api/buses/${rc_plate_number}`);
                if (result.data?.status) {
                    alert("Bus deleted successfully!");
                    fetchBuses();
                } else {
                    alert(result.data?.message || "Failed to delete bus");
                }
            } catch (error) {
                console.error("Error deleting bus:", error);
                alert("An error occurred while deleting the bus.");
            }
        }
    };

    // Fetch Routes and Buses from Backend
    useEffect(() => {
        const fetchRoutes = async () => {
            setLoadingRoutes(true);
            try {
                const result = await api.get('/api/routes');
                if (result.data?.status) {
                    setRoutes(result.data.data);
                }
            } catch (error) {
                console.error("Error fetching routes:", error);
            } finally {
                setLoadingRoutes(false);
            }
        };

        fetchRoutes();
        fetchBuses();
    }, []);

    // Calculate Summary Stats
    const activeBuses = buses.filter(b => b.status === 'ACTIVE').length;
    const inactiveBuses = buses.filter(b => b.status === 'INACTIVE').length;
    const repairBuses = buses.filter(b => b.status === 'REPAIR').length;

    // Filter Logic
    const filteredBuses = buses.filter(bus => {
        if (!searchTerm) return true;
        const valueToSearch = bus[searchField]?.toString().toLowerCase() || '';
        return valueToSearch.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-navy">Fleet Management</h1>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="btn btn-primary"
                >
                    <Plus size={18} /> Add New Bus
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card flex items-center gap-4 border-l-4 border-l-emerald-500">
                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                        <Bus size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Active Buses</p>
                        <h3 className="text-2xl font-bold text-slate-800">{activeBuses}</h3>
                    </div>
                </div>
                <div className="card flex items-center gap-4 border-l-4 border-l-slate-400">
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-500">
                        <Bus size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Inactive Buses</p>
                        <h3 className="text-2xl font-bold text-slate-800">{inactiveBuses}</h3>
                    </div>
                </div>
                <div className="card flex items-center gap-4 border-l-4 border-l-amber-500">
                    <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">In Repair / Pending</p>
                        <h3 className="text-2xl font-bold text-slate-800">{repairBuses}</h3>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="card flex flex-col sm:flex-row gap-4">
                <div className="flex-1 flex gap-2 w-full">
                    <label htmlFor="searchField" className="sr-only">Search Field</label>
                    <select
                        id="searchField"
                        name="searchField"
                        aria-label="Search Field"
                        className="form-input w-40 bg-slate-50"
                        value={searchField}
                        onChange={(e) => setSearchField(e.target.value)}
                    >
                        <option value="rc_plate_number">RC Plate Number</option>
                        <option value="route_name">Route</option>
                        <option value="engine_number">Engine Number</option>
                    </select>
                    <div className="relative flex-1">
                        <label htmlFor="searchQuery" className="sr-only">Search Term</label>
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="searchQuery"
                            name="searchQuery"
                            type="text"
                            aria-label="Search Query"
                            className="form-input pl-10"
                            placeholder="Enter search term..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Bus No.</th>
                            <th>Engine Number</th>
                            <th>RC Plate Number</th>
                            <th>Cap.</th>
                            <th>Route</th>
                            <th>Status</th>
                            <th className="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredBuses.map((bus) => (
                            <tr
                                key={bus.rc_plate_number}
                                className="cursor-pointer group"
                                onClick={() => navigate(`/buses/${bus.rc_plate_number}`)}
                            >
                                <td className="font-bold text-navy text-lg">{bus.bus_no || 'N/A'}</td>
                                <td className="font-semibold text-slate-600 group-hover:text-blue-600 italic font-mono">{bus.engine_number}</td>
                                <td>{bus.rc_plate_number}</td>
                                <td className="font-bold">{bus.seating_capacity}</td>
                                <td>{bus.route_name || 'No Route'}</td>
                                <td>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                        ${(bus.status === 'Active' || bus.status === 'ACTIVE') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            (bus.status === 'Repair' || bus.status === 'REPAIR') ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                'bg-slate-100 text-slate-700 border-slate-200'}
                                    `}>
                                        {bus.status}
                                    </span>
                                </td>
                                <td className="text-right space-x-3" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => handleEdit(bus)}
                                        className="text-navy hover:text-navy-light text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(bus.rc_plate_number)}
                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredBuses.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                    No buses found matching your criteria.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-slate-200">
                            <h2 className="text-lg font-bold text-navy">
                                {isEditMode ? 'Update Vehicle Details' : 'Register New Vehicle'}
                            </h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label text-[10px] font-black uppercase tracking-widest text-slate-400">Bus Number</label>
                                <input
                                    type="number"
                                    name="bus_no"
                                    className="form-input bg-slate-50 border-slate-100 rounded-xl font-bold text-navy focus:border-navy text-xl"
                                    placeholder="e.g. 1"
                                    value={newBusData.bus_no}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label text-[10px] font-black uppercase tracking-widest text-slate-400">Engine Number</label>
                                <input
                                    type="text"
                                    name="engine_number"
                                    className="form-input bg-slate-50 border-slate-100 rounded-xl font-bold text-navy focus:border-navy"
                                    placeholder="e.g. ENG123456"
                                    value={newBusData.engine_number}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label text-[10px] font-black uppercase tracking-widest text-slate-400">Seating Capacity</label>
                                    <input
                                        type="number"
                                        name="seating_capacity"
                                        className="form-input bg-slate-50 border-slate-100 rounded-xl font-bold text-navy focus:border-navy"
                                        placeholder="e.g. 40"
                                        value={newBusData.seating_capacity}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div>
                                    <label className="form-label text-[10px] font-black uppercase tracking-widest text-slate-400">RC Plate Number</label>
                                    <input
                                        type="text"
                                        name="rc_plate_number"
                                        className={`form-input bg-slate-50 border-slate-100 rounded-xl font-bold text-navy focus:border-navy ${isEditMode ? 'bg-slate-200 cursor-not-allowed opacity-60' : ''}`}
                                        placeholder="AP-XX-XX-XXXX"
                                        value={newBusData.rc_plate_number}
                                        onChange={handleInputChange}
                                        disabled={isEditMode}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Assigned Route</label>
                                <select
                                    name="route_id"
                                    className="form-input"
                                    disabled={loadingRoutes}
                                    value={newBusData.route_id}
                                    onChange={handleInputChange}
                                >
                                    <option value="">{loadingRoutes ? 'Loading routes...' : 'Select a Route'}</option>
                                    {routes.map((route) => (
                                        <option key={route.route_id} value={route.route_id}>
                                            {route.route_name} {route.start_location ? `(${route.start_location})` : ''}
                                        </option>
                                    ))}
                                    {!loadingRoutes && routes.length === 0 && (
                                        <option value="" disabled>No routes found in database</option>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Date of Purchase</label>
                                <input
                                    type="date"
                                    name="purchase_date"
                                    className="form-input"
                                    max={new Date().toISOString().split("T")[0]}
                                    value={newBusData.purchase_date}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label className="form-label">Status</label>
                                <div className="flex gap-4 mt-2">
                                    {['ACTIVE', 'INACTIVE', 'REPAIR'].map((statusOption) => (
                                        <label key={statusOption} className="inline-flex items-center cursor-pointer">
                                            <input
                                                type="radio"
                                                name="status"
                                                value={statusOption}
                                                checked={newBusData.status === statusOption}
                                                onChange={handleInputChange}
                                                className="w-4 h-4 text-navy border-slate-300 focus:ring-navy"
                                            />
                                            <span className="ml-2 text-[10px] font-black uppercase tracking-widest text-slate-600">{statusOption}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50">
                            <button onClick={resetForm} className="btn btn-outline">Cancel</button>
                            <button
                                onClick={async () => {
                                    try {
                                        const url = isEditMode
                                            ? `${API_BASE}/api/buses/${newBusData.rc_plate_number}`
                                            : `${API_BASE}/api/buses`;

                                        const response = await fetch(url, {
                                            method: isEditMode ? 'PUT' : 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                bus_no: newBusData.bus_no,
                                                rc_plate_number: newBusData.rc_plate_number,
                                                seating_capacity: newBusData.seating_capacity,
                                                engine_number: newBusData.engine_number,
                                                route_id: newBusData.route_id,
                                                purchase_date: newBusData.purchase_date,
                                                status: newBusData.status
                                            })
                                        });
                                        const result = await response.json();
                                        if (result.status) {
                                            alert(isEditMode ? "Bus updated successfully!" : "Bus registered successfully!");
                                            resetForm();
                                            fetchBuses(); // Refresh list
                                        } else {
                                            alert(result.message || "Operation failed");
                                        }
                                    } catch (error) {
                                        console.error("Error saving bus:", error);
                                        alert("An error occurred while saving the bus.");
                                    }
                                }}
                                className="btn btn-primary"
                                disabled={!newBusData.rc_plate_number || !newBusData.engine_number || !newBusData.bus_no}
                            >
                                {isEditMode ? 'Update Record' : 'Save Bus Record'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
