import { Bus, Users, UserSquare2, ChevronLeft, ChevronRight, FileX, BarChart3, AlertCircle, ShieldAlert, Car } from 'lucide-react';

const API_BASE = 'https://tracobusinvcicd.duckdns.org';

// ── Compliance Calendar ───────────────────────────────────────────────────────
const CalendarWidget = () => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(null);
    const [expirations, setExpirations] = useState([]);

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

    useEffect(() => {
        fetch(`${API_BASE}/api/analytics/calendar-expirations`)
            .then(r => r.json())
            .then(result => { if (result.status) setExpirations(result.data); })
            .catch(console.error);
    }, []);

    // Build a map: "YYYY-MM-DD" → [events]
    const expirationsByDate = expirations.reduce((acc, item) => {
        const key = item.expiry_date?.split('T')[0];
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

    const getDateKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const handlePrev = () => {
        setSelectedDate(null);
        setCurrentMonth(prev => {
            if (prev === 0) {
                setCurrentYear(y => y - 1);
                return 11;
            }
            return prev - 1;
        });
    };
    const handleNext = () => {
        setSelectedDate(null);
        setCurrentMonth(prev => {
            if (prev === 11) {
                setCurrentYear(y => y + 1);
                return 0;
            }
            return prev + 1;
        });
    };

    const renderGrid = () => {
        const cells = [];
        for (let i = 0; i < firstDayIndex; i++) cells.push(<div key={`e-${i}`} className="h-8" />);

        for (let day = 1; day <= daysInMonth; day++) {
            const key = getDateKey(currentYear, currentMonth, day);
            const events = expirationsByDate[key] || [];
            const hasExpiry = events.length > 0;
            const hasDoc = events.some(e => e.category === 'document');
            const hasDriver = events.some(e => e.category === 'driver');
            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
            const isSelected = selectedDate === day;

            cells.push(
                <div key={day} className="flex items-center justify-center h-9">
                    <div
                        onClick={() => setSelectedDate(hasExpiry ? (isSelected ? null : day) : null)}
                        className={`relative flex flex-col items-center justify-center text-sm rounded-xl w-8 h-8 transition-all
                            ${isToday ? 'ring-2 ring-navy ring-offset-1 font-bold' : ''}
                            ${isSelected ? 'bg-navy text-white shadow-md' : ''}
                            ${hasExpiry && !isSelected ? 'font-bold text-navy bg-red-50 hover:bg-red-100 cursor-pointer' : ''}
                            ${!hasExpiry ? 'text-slate-500 hover:bg-slate-50 cursor-default' : ''}
                        `}
                    >
                        <span className="leading-none">{day}</span>
                        {hasExpiry && (
                            <div className="flex gap-0.5 mt-0.5">
                                {hasDoc && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-orange-300' : 'bg-orange-500'}`} />}
                                {hasDriver && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-blue-300' : 'bg-blue-500'}`} />}
                            </div>
                        )}
                    </div>
                </div>
            );
        }
        return cells;
    };

    const selectedKey = selectedDate ? getDateKey(currentYear, currentMonth, selectedDate) : null;
    const selectedEvents = selectedKey ? (expirationsByDate[selectedKey] || []) : [];

    return (
        <div className="flex flex-col h-full gap-4">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
                <h3 className="font-black text-navy text-sm uppercase tracking-widest">Compliance Calendar</h3>
                <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1 bg-slate-50">
                    <button onClick={handlePrev} className="p-1.5 hover:bg-white rounded-lg transition text-slate-500"><ChevronLeft size={16}/></button>
                    <span className="font-bold text-xs w-28 text-center">{monthNames[currentMonth]} {currentYear}</span>
                    <button onClick={handleNext} className="p-1.5 hover:bg-white rounded-lg transition text-slate-500"><ChevronRight size={16}/></button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"/> Doc Expiry</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"/> License Expiry</span>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7 gap-y-1">
                {renderGrid()}
            </div>

            {/* Schedule Panel */}
            <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-4 overflow-y-auto min-h-[100px]">
                {selectedDate && selectedEvents.length > 0 ? (
                    <div className="space-y-3">
                        <h4 className="text-xs font-black text-navy uppercase tracking-widest flex items-center justify-between">
                            <span>{monthNames[currentMonth]} {selectedDate}</span>
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-black text-[10px]">{selectedEvents.length} expiring</span>
                        </h4>
                        {selectedEvents.map((ev, i) => (
                            <div key={i} className={`bg-white rounded-xl p-3 border flex items-center gap-3 shadow-sm
                                ${ev.category === 'driver' ? 'border-blue-100' : 'border-orange-100'}`
                            }>
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0
                                    ${ev.category === 'driver' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {ev.category === 'driver' ? <Car size={16}/> : <ShieldAlert size={16}/>}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-black text-navy text-xs truncate">{ev.title}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{ev.ref}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : selectedDate ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-4">
                        <FileX size={20}/>
                        <p className="text-xs">No expirations on this date.</p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-2 py-4">
                        <AlertCircle size={20}/>
                        <p className="text-xs text-center">Click a marked date to view expiring documents & licenses.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function Dashboard() {
    const [buses, setBuses] = useState([]);
    const [studentCounts, setStudentCounts] = useState({ btech: [], archive: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch(`${API_BASE}/api/buses`).then(r => r.json()),
            fetch(`${API_BASE}/api/students/summary/counts`).then(r => r.json()),
        ]).then(([busRes, studentRes]) => {
            if (busRes.status) setBuses(busRes.data);
            if (studentRes.status) setStudentCounts(studentRes.data);
        }).catch(console.error)
          .finally(() => setLoading(false));
    }, []);

    const activeBuses = buses.filter(b => ['ACTIVE','Active'].includes(b.status)).length;
    const repairBuses = buses.filter(b => ['REPAIR','Repair'].includes(b.status)).length;
    const totalStudents = (studentCounts.btech?.reduce((s, r) => s + parseInt(r.count || 0), 0) || 0);

    if (loading) return <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy mx-auto"/></div>;

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            <h1 className="text-2xl font-bold text-navy">Fleet Overview</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Stats + Chart placeholder */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Active Fleet */}
                        <div className="card bg-navy text-white border-none shadow-xl shadow-navy/10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-blue-200 text-[10px] font-black mb-1 uppercase tracking-wider">Total Active Fleet</p>
                                    <h2 className="text-4xl font-black italic">{activeBuses}</h2>
                                </div>
                                <div className="p-3 bg-white/10 rounded-xl">
                                    <Bus size={24} className="text-white"/>
                                </div>
                            </div>
                            <div className="mt-4 text-[10px] font-black uppercase text-blue-100 bg-white/10 inline-block px-3 py-1 rounded-full">
                                {repairBuses} vehicles in maintenance
                            </div>
                        </div>

                        {/* Students */}
                        <div className="card border-l-4 border-l-blue-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-wider">Students Registered</p>
                                    <h2 className="text-3xl font-black text-navy">{totalStudents}</h2>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <Users size={24} className="text-blue-600"/>
                                </div>
                            </div>
                            <div className="mt-4 text-[10px] font-bold text-emerald-600 bg-emerald-50 inline-block px-2 py-1 rounded">
                                Active students this academic year
                            </div>
                        </div>

                        {/* Routes */}
                        <div className="card border-l-4 border-l-emerald-500">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-slate-500 text-[10px] font-black mb-1 uppercase tracking-wider">Live Operations</p>
                                    <h2 className="text-3xl font-black text-navy">100%</h2>
                                </div>
                                <div className="p-3 bg-emerald-50 rounded-xl">
                                    <UserSquare2 size={24} className="text-emerald-600"/>
                                </div>
                            </div>
                            <div className="mt-4 text-[10px] font-bold text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded">
                                All routes synchronized
                            </div>
                        </div>
                    </div>

                    {/* Chart Placeholder */}
                    <div className="card flex-1 min-h-[300px] flex items-center justify-center bg-slate-50/50 border-dashed border-2 border-slate-200 relative overflow-hidden">
                        <div className="absolute top-4 right-4 animate-pulse">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"/>
                        </div>
                        <div className="text-center text-slate-400 space-y-4">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto text-blue-500">
                                <BarChart3 size={32}/>
                            </div>
                            <div>
                                <p className="font-black text-navy uppercase tracking-widest text-xs">Fleet Telemetry Activity</p>
                                <p className="text-sm mt-1">Analyzing real-time movement and fuel consumption...</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Compliance Calendar */}
                <div className="card lg:col-span-1 min-h-[500px] shadow-lg border-slate-100">
                    <CalendarWidget />
                </div>
            </div>
        </div>
    );
}
