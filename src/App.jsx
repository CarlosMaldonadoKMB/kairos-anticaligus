import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './componentes/ProtectedRoute';
import Login from './componentes/login';
import RegistroConteos from './RegistroConteos'; // Tu formulario principal

function App() {
  return (
    <AuthProvider>
      <Router>
      <Routes>
  {/* Ruta pública de acceso */}
  <Route path="/login" element={<Login />} />
  
  {/* Ruta protegida para la captura de datos en balsa */}
  <Route 
    path="/terreno" 
    element={
      <ProtectedRoute rolesPermitidos={['muestreador', 'veterinario', 'gerente_salud']}>
        <RegistroConteos />
      </ProtectedRoute>
    } 
  />

  {/* Cualquier URL desconocida manda al login por defecto */}
  <Route path="*" element={<Navigate to="/login" replace />} />
</Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;