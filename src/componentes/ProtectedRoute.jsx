import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, rolesPermitidos }) => {
  const { session, rol, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Verificando credenciales...</p>
      </div>
    );
  }

  // Si no hay sesión, patada al login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Si tiene sesión pero su rol no está permitido en esta vista
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4 text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-2">Acceso Denegado</h2>
        <p>Tu nivel de usuario ({rol}) no tiene permisos para ver esta pantalla.</p>
      </div>
    );
  }

  // Si pasa todo, le mostramos el componente
  return children;
};