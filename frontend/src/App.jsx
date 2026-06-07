import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BusList from './pages/Buses/BusList';
import BusDetails from './pages/Buses/BusDetails';
import BusOils from './pages/Buses/Modules/BusOils';
import BusSpares from './pages/Buses/Modules/BusSpares';
import BusDiesel from './pages/Buses/Modules/BusDiesel';
import BusReadings from './pages/Buses/Modules/BusReadings';
import BusDocuments from './pages/Buses/Modules/BusDocuments';
import Analytics from './pages/Analytics';
import Reminders from './pages/Reminders';
import Stocks from './pages/Stocks';
import PurchaseHistory from './pages/PurchaseHistory';
import OdometerEntry from './pages/Entry/OdometerEntry';
import DieselEntry from './pages/Entry/DieselEntry';
import TransportRoutes from './pages/Transport/Routes';
import Students from './pages/Transport/Students';
import Drivers from './pages/Transport/Drivers';
import DriverDetails from './pages/Transport/DriverDetails';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Dashboard Layout Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          
          <Route path="buses">
            <Route index element={<BusList />} />
            <Route path=":id" element={<BusDetails />} />
            <Route path=":id/oils" element={<BusOils />} />
            <Route path=":id/spares" element={<BusSpares />} />
            <Route path=":id/diesel" element={<BusDiesel />} />
            <Route path=":id/readings" element={<BusReadings />} />
            <Route path=":id/documents" element={<BusDocuments />} />
          </Route>

          <Route path="routes" element={<TransportRoutes />} />
          <Route path="students" element={<Students />} />
          <Route path="drivers">
            <Route index element={<Drivers />} />
            <Route path=":id" element={<DriverDetails />} />
          </Route>
          <Route path="analytics" element={<Analytics />} />
          <Route path="reminders" element={<Reminders />} />
          <Route path="stocks" element={<Stocks />} />
          <Route path="stocks/:spare_id/purchases" element={<PurchaseHistory />} />
          <Route path="entry">
            <Route path="odometer" element={<OdometerEntry />} />
            <Route path="diesel" element={<DieselEntry />} />
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
