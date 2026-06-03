import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './componentes/ProtectedRoute';
import Login from './componentes/login';
import RegistroConteos from './RegistroConteos'; 
import Dashboard from './componentes/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Ruta: Balsa (Operarios, Veterinarios y Gerentes) */}
          <Route 
            path="/terreno" 
            element={
              <ProtectedRoute rolesPermitidos={['muestreador', 'veterinario', 'gerente_salud']}>
                <RegistroConteos />
              </ProtectedRoute>
            } 
          />

          {/* Ruta: Puerto Montt (Solo Gerentes y Veterinarios) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute rolesPermitidos={['gerente_salud', 'veterinario']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;