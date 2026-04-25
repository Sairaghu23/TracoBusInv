import { FileX, AlertTriangle, Calendar, AlertCircle, FileCheck2, Clock, Search, User, Car } from 'lucide-react';

const API_BASE = 'https://tracobusinvcicd.duckdns.org';

export default function Reminders() {
    const [duration, setDuration] = useState(30);
    const [reminders, setReminders] = useState({});
    const [docTypes, setDocTypes] = useState([]);
    const [expiringDrivers, setExpiringDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [typesRes, matrixRes, driverRes] = await Promise.all([
                fetch(`${API_BASE}/api/document-types`),
                fetch(`${API_BASE}/api/documents/compliance-matrix`),
                fetch(`${API_BASE}/api/drivers`)
            ]);
            const [typesResult, matrixResult, driverResult] = await Promise.all([
                typesRes.json(), 
                matrixRes.json(), 
                driverRes.json()
            ]);

            if (typesResult.status) {
                setDocTypes(typesResult.data.map(dt => dt.document_name));
            }

            if (matrixResult.status) {
                const data = matrixResult.data;
                const grouped = {};
                data.forEach(item => {
                    if (!grouped[item.rc_plate_number]) {
                        grouped[item.rc_plate_number] = { 
                            bus_no: item.bus_no, 
                            rc_plate_number: item.rc_plate_number, 
                            docs: {} 
                        };
                    }
                    if (item.expiry_date) {
                        grouped[item.rc_plate_number].docs[item.document_name] = {
                            expiry_date: item.expiry_date,
                            provider: item.provider
                        };
                    }
                });
                setReminders(grouped);
            }

            if (driverResult.status) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const expiring = driverResult.data.filter(d => {
                    if (!d.license_expiry) return false;
                    const expiry = new Date(d.license_expiry);
                    const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                    return days <= parseInt(duration);
                }).sort((a, b) => new Date(a.license_expiry) - new Date(b.license_expiry));
                setExpiringDrivers(expiring);
            }
        } catch (err) {
            console.error("Error fetching reminders:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const calculateStatus = (expiryDate) => {
        if (!expiryDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        const daysRemaining = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (daysRemaining < 0) return { class: 'bg-red-50 text-red-700 border-red-200 animate-pulse', label: 'Expired' };
        if (daysRemaining <= 7) return { class: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Critical' };
        return { class: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Expiring' };
    };

    const getLicenseStatus = (expiry_date) => {
        const today = new Date(); today.setHours(0,0,0,0);
        const expiry = new Date(expiry_date);
        const days = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (days < 0) return { label: 'Expired', cls: 'bg-red-50 text-red-700 border-red-200 animate-pulse' };
        if (days <= 7) return { label: `${days}d • Critical`, cls: 'bg-orange-50 text-orange-700 border-orange-200' };
        return { label: `${days} days left`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    };

    const reminderEntries = Object.values(reminders);

    return (
        <div className="max-w-screen-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex w-14 h-14 bg-amber-100 border-2 border-amber-200 rounded-2xl items-center justify-center text-amber-600 shadow-inner">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-navy tracking-tight">Compliance Alerts</h1>
                        <p className="text-slate-500 font-medium">Vehicle documents + Driver licenses expiring within the target duration.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:border-navy transition-all">
                        <Clock size={18} className="text-slate-400 mr-2" />
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mr-3">Scan Limit:</span>
                        <input
                            type="number" min="1" max="365"
                            className="bg-transparent w-16 font-black text-navy text-lg text-center outline-none border-b-2 border-slate-300 focus:border-navy transition-colors"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        />
                        <span className="text-sm font-bold text-slate-500 ml-2">Days</span>
                    </div>
                    <button onClick={fetchData} className="btn btn-primary shadow-lg shadow-blue-100 flex items-center gap-2 h-full py-3">
                        <Search size={18} /> Scan
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-32 text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-4 border-navy mx-auto" /></div>
            ) : (reminderEntries.length === 0 && expiringDrivers.length === 0) ? (
                <div className="card p-32 text-center flex flex-col items-center justify-center gap-6 bg-slate-50/50 border-dashed border-4 border-slate-200 rounded-3xl">
                    <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center text-emerald-500 border border-slate-100">
                        <FileCheck2 size={48} />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black text-navy italic tracking-tighter">All Systems Go!</h2>
                        <p className="text-slate-500 text-lg mt-2 font-medium">No expirations within the next <span className="font-black text-navy">{duration} days</span>.</p>
                    </div>
                </div>
            ) : (
                <>
                    {/* Bus Document Compliance Matrix */}
                    <div>
                        <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                            <Car size={20} /> Fleet Compliance Matrix
                        </h2>
                        <div className="table-container shadow-2xl border-0 rounded-3xl overflow-hidden bg-white">
                            <table className="admin-table w-full whitespace-nowrap">
                                <thead className="bg-navy text-white">
                                    <tr>
                                        <th className="py-6 pl-8 text-left border-r border-white/10 uppercase tracking-widest text-[10px] font-black">Vehicle Assets</th>
                                        {docTypes.map(type => (
                                            <th key={type} className="py-6 text-center uppercase tracking-widest text-[10px] font-black border-r border-white/5">
                                                {type}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reminderEntries.length === 0 ? (
                                        <tr>
                                            <td colSpan={docTypes.length + 1} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest italic">
                                                No vehicles registered in the fleet.
                                            </td>
                                        </tr>
                                    ) : (
                                        reminderEntries.map((bus) => (
                                            <tr key={bus.rc_plate_number} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-5 pl-8 border-r border-slate-100">
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-navy text-xl leading-none">{bus.rc_plate_number}</span>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Bus No: {bus.bus_no || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                {docTypes.map(type => {
                                                    const docData = bus.docs[type];
                                                    const status = calculateStatus(docData?.expiry_date);
                                                    return (
                                                        <td key={type} className="py-5 px-4 text-center border-r border-slate-50 align-middle">
                                                            {docData && status ? (
                                                                <div className="flex flex-col items-center gap-1.5">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="font-bold text-xs text-navy">{new Date(docData.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                                                        {docData.provider && (
                                                                            <span className="text-[9px] text-slate-400 font-medium truncate max-w-[80px]" title={docData.provider}>
                                                                                {docData.provider}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className={`px-2 py-0.5 text-[9px] uppercase tracking-wider font-black rounded border ${status.class}`}>{status.label}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center text-slate-300">
                                                                    <div className="w-6 h-1 bg-slate-50 rounded-full mb-1 opacity-20" />
                                                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">NULL</span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Driver License Expiry Section */}
                    <div>
                        <h2 className="text-lg font-black text-navy uppercase tracking-widest mb-3 flex items-center gap-2">
                            <User size={20} /> Driver License Expirations
                        </h2>
                        {expiringDrivers.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex items-center gap-4 text-slate-400">
                                <FileCheck2 size={24} className="text-emerald-400 shrink-0" />
                                <p className="font-bold text-sm">No driver licenses expiring within the next <span className="font-black text-navy">{duration} days</span>.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl shadow-2xl border-0 overflow-hidden">
                                <table className="admin-table w-full">
                                    <thead className="bg-violet-900 text-white">
                                        <tr>
                                            <th className="py-5 pl-8 text-left uppercase tracking-widest text-[10px] font-black">Driver Name</th>
                                            <th className="uppercase tracking-widest text-[10px] font-black">License No.</th>
                                            <th className="uppercase tracking-widest text-[10px] font-black">Contact</th>
                                            <th className="uppercase tracking-widest text-[10px] font-black text-center pr-8">License Expiry</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {expiringDrivers.map(driver => {
                                            const status = getLicenseStatus(driver.license_expiry);
                                            return (
                                                <tr key={driver.driver_id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-4 pl-8">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black text-sm">
                                                                {driver.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-black text-navy">{driver.name}</p>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{driver.status}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="font-bold text-slate-600 font-mono">{driver.license_number}</td>
                                                    <td className="font-black text-blue-600 italic">{driver.phone}</td>
                                                    <td className="pr-8 text-center">
                                                        <div className="flex flex-col items-center gap-1.5">
                                                            <span className="font-bold text-xs text-slate-600 flex items-center gap-1">
                                                                <Calendar size={11} className="text-slate-400" />
                                                                {new Date(driver.license_expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                            </span>
                                                            <span className={`px-3 py-1 text-[10px] uppercase tracking-widest font-black rounded-lg border ${status.cls}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
