import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Bus, Users, UserSquare2, 
  BarChart3, Bell, Settings2, LogOut, Menu, X, Building,
  Gauge, Fuel, MapPin
} from 'lucide-react';

export default function MainLayout() {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navLinks = [
    { name: 'Overview', path: '/', icon: LayoutDashboard, exact: true },
    { name: 'Buses', path: '/buses', icon: Bus },
    { name: 'Routes', path: '/routes', icon: MapPin },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Drivers', path: '/drivers', icon: UserSquare2 },
    { name: 'Overall Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Reminders', path: '/reminders', icon: Bell },
    { name: 'Spare Stocks', path: '/stocks', icon: Settings2 },
    { name: 'Odometer Entry', path: '/entry/odometer', icon: Gauge },
    { name: 'Diesel Entry', path: '/entry/diesel', icon: Fuel },
  ];

  return (
    <div className="flex h-screen bg-surface">
      {/* Collapsible Sidebar */}
      <aside 
        className={`${isCollapsed ? 'w-20' : 'w-64'} bg-navy text-white transition-all duration-300 ease-in-out flex flex-col flex-shrink-0 z-20 shadow-xl`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-navy-light">
          {!isCollapsed && (
            <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
              <Building size={24} className="text-blue-300" />
              <span className="font-bold tracking-wide">Transport Dept</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <Building size={24} className="text-blue-300" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.exact}
              className={({ isActive }) => `
                flex items-center px-4 py-3 mx-2 rounded-lg transition-colors
                ${isActive ? 'bg-navy-light text-white' : 'text-slate-300 hover:bg-navy-light hover:text-white'}
                ${isCollapsed ? 'justify-center mx-3' : 'gap-3'}
              `}
              title={isCollapsed ? link.name : ''}
            >
              <link.icon size={20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium whitespace-nowrap">{link.name}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-navy-light">
          <button 
            onClick={() => navigate('/login')}
            className={`w-full flex items-center text-slate-300 hover:text-white transition-colors ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}
            title={isCollapsed ? "Logout" : ""}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!isCollapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-500 hover:text-navy transition-colors focus:outline-none"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-slate-800">Institutional Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative text-slate-500 hover:text-navy transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">System Admin</div>
                <div className="text-xs text-slate-500">Transport Node A</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-navy-light text-white flex items-center justify-center font-bold shadow-sm">
                SA
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-auto bg-surface p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
