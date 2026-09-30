import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import CommandCenter from '@/pages/CommandCenter';
import ThermalMap from '@/pages/ThermalMap';
import InvestigationQueue from '@/pages/InvestigationQueue';
import EventInvestigation from '@/pages/EventInvestigation';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<CommandCenter />} />
          <Route path="/map" element={<ThermalMap />} />
          <Route path="/queue" element={<InvestigationQueue />} />
          <Route path="/investigate/:eventId" element={<EventInvestigation />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
