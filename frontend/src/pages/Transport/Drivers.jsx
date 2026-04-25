import { useNavigate } from 'react-router-dom';

const API_BASE = 'https://tracobusinvcicd.duckdns.org';
import { 
    User, Search, Plus, FileText, ChevronLeft, 
    Download, Phone, ShieldCheck, Filter, UserPlus, X, Trash2, Edit2
} from 'lucide-react';

export default function Drivers() {
    const navigate = useNavigate();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeModal, setActiveModal] = useState(false);
    const [newDriver, setNewDriver] = useState({
        name: '', phone: '', license_number: '', status: 'ACTIVE', address: '', joining_date: new Date().toISOString().split('T')[0], license_expiry: ''
    });

    useEffect(() => {
        fetchDrivers();
    }, []);

    const fetchDrivers = async () => {
        try {
            const response = await fetch(`${API_BASE}/api/drivers`);
            const result = await response.json();
            if (result.status) setDrivers(result.data);
        } catch (error) {
            console.error("Error fetching drivers:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddDriver = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/api/drivers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newDriver)
            });
            const result = await response.json();
            if (result.status) {
                fetchDrivers();
                setActiveModal(false);
                setNewDriver({ name: '', phone: '', license_number: '', status: 'ACTIVE', address: '', joining_date: new Date().toISOString().split('T')[0], license_expiry: '' });
            }
        } catch (error) {
            console.error("Error adding driver:", error);
        }
    };

    const filteredDrivers = drivers.filter(d => 
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        d.license_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status?.toUpperCase()) {
            case 'ACTIVE': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'INACTIVE': return 'bg-red-50 text-red-600 border-red-100';
            case 'ON_LEAVE': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-navy text-white rounded-2xl flex items-center justify-center shadow-lg shadow-navy/20">
                        <User size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-navy italic tracking-tight">Driver Fleet Control</h1>
                        <p className="text-slate-500 font-medium">Manage institutional drivers, licensing, and availability.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setActiveModal(true)}
                        className="btn bg-orange-600 border-none text-white hover:bg-orange-700 shadow-lg shadow-orange-100 rounded-xl px-6 py-3 flex items-center gap-2 font-bold transition-all transform hover:-translate-y-1"
                    >
                        <UserPlus size={20} /> Add New Driver
                    </button>
                </div>
            </div>

            {/* Filter Hub */}
            <div className="card bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 focus-within:border-orange-500 transition-all">
                    <Search size={20} className="text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Search by name or license number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none w-full text-navy placeholder:text-slate-400 focus:outline-none font-medium ml-3"
                    />
                </div>
            </div>

            {/* Main Table */}
            <div className="table-container bg-white shadow-2xl shadow-slate-200/50 border border-slate-100 rounded-[2.5rem] overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="py-6 pl-8">S.No</th>
                            <th>Driver Details</th>
                            <th>Status</th>
                            <th>License Number</th>
                            <th>License Expiry</th>
                            <th>Contact</th>
                            <th className="pr-8 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="6" className="py-20 text-center text-slate-400 animate-pulse font-bold italic">Initializing Driver Registry...</td></tr>
                        ) : filteredDrivers.length === 0 ? (
                            <tr><td colSpan="6" className="py-20 text-center text-slate-400 italic">No drivers found in the registry.</td></tr>
                        ) : filteredDrivers.map((driver, idx) => (
                            <tr key={driver.driver_id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="py-5 pl-8 text-slate-400 font-black italic">{idx + 1}</td>
                                <td>
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-navy-light text-white flex items-center justify-center font-bold text-sm shadow-sm">
                                            {driver.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-navy italic">{driver.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Joined: {new Date(driver.joining_date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(driver.status)}`}>
                                        {driver.status}
                                    </span>
                                </td>
                                <td className="font-bold text-slate-600">{driver.license_number}</td>
                                <td>
                                    {driver.license_expiry ? (() => {
                                        const today = new Date();
                                        const expiry = new Date(driver.license_expiry);
                                        const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                                        const label = days < 0 ? 'Expired' : days <= 30 ? `${days}d left` : new Date(driver.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                        const cls = days < 0 ? 'text-red-600 bg-red-50 border-red-200' : days <= 30 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-emerald-600 bg-emerald-50 border-emerald-100';
                                        return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>{label}</span>;
                                    })() : <span className="text-slate-300 text-[10px] font-black uppercase tracking-widest">— Not Set —</span>}
                                </td>
                                <td className="font-black text-blue-600 italic">{driver.phone}</td>
                                <td className="pr-8 text-right">
                                    <button 
                                        onClick={() => navigate(`/drivers/${driver.driver_id}`)}
                                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-navy hover:bg-navy hover:text-white transition-all shadow-sm hover:shadow-md"
                                        title="View Details"
                                    >
                                        <FileText size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Driver Modal */}
            {activeModal && (
                <div className="fixed inset-0 bg-navy/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20">
                        <div className="p-8 bg-navy text-white relative">
                            <button onClick={() => setActiveModal(false)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                            <div className="p-4 bg-navy-light rounded-2xl w-fit mb-4">
                                <UserPlus size={32} />
                            </div>
                            <h2 className="text-2xl font-black italic tracking-tight">Onboard New Driver</h2>
                            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest opacity-80">Institutional Fleet Employment</p>
                        </div>
                        
                        <form onSubmit={handleAddDriver} className="p-8 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-navy transition-all font-medium"
                                        value={newDriver.name}
                                        onChange={(e) => setNewDriver({...newDriver, name: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <input 
                                        required
                                        type="text" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-navy transition-all font-medium"
                                        value={newDriver.phone}
                                        onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Number</label>
                                <input 
                                    required
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-navy transition-all font-medium"
                                    value={newDriver.license_number}
                                    onChange={(e) => setNewDriver({...newDriver, license_number: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-navy transition-all font-medium"
                                        value={newDriver.joining_date}
                                        onChange={(e) => setNewDriver({...newDriver, joining_date: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">License Expiry Date</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-navy transition-all font-medium"
                                        value={newDriver.license_expiry}
                                        onChange={(e) => setNewDriver({...newDriver, license_expiry: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select 
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 outline-none focus:border-navy transition-all font-medium"
                                        value={newDriver.status}
                                        onChange={(e) => setNewDriver({...newDriver, status: e.target.value})}
                                    >
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="ON_LEAVE">On Leave</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                <textarea 
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 outline-none focus:border-navy transition-all font-medium h-20"
                                    value={newDriver.address}
                                    onChange={(e) => setNewDriver({...newDriver, address: e.target.value})}
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setActiveModal(false)} className="flex-1 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-navy text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-navy-light transition-all shadow-lg shadow-navy/20">Onboard Driver</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
