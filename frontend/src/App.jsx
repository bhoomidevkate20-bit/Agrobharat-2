import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import FarmerDashboard from './pages/FarmerDashboard'
import FPODashboard from './pages/FPODashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import DeliveryDashboard from './pages/DeliveryDashboard'
import InspectorDashboard from './pages/InspectorDashboard'
import AiMarketHub from './pages/AiMarketHub'

export default function App() {
  return (
    <div className="min-h-screen bg-paper font-body">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/market-ai" element={<AiMarketHub />} />

        <Route
          path="/dashboard/farmer"
          element={<ProtectedRoute allowedRoles={['farmer']}><FarmerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard/fpo"
          element={<ProtectedRoute allowedRoles={['fpo']}><FPODashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard/customer"
          element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard/delivery_agent"
          element={<ProtectedRoute allowedRoles={['delivery_agent']}><DeliveryDashboard /></ProtectedRoute>}
        />
        <Route
          path="/dashboard/inspector"
          element={<ProtectedRoute allowedRoles={['inspector']}><InspectorDashboard /></ProtectedRoute>}
        />
      </Routes>
    </div>
  )
}
