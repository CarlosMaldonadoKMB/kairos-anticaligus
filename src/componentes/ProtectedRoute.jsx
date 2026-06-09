import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, rolesPermitidos }) => {
  // Cambiamos 'session' por 'user' para coincidir con tu nuevo AuthContext
  const { user, rol } = useAuth();

  // (Ya no necesitamos el bloque 'if (loading)' aquí, porque el nuevo AuthContext 
  // no renderiza las rutas hasta que termina de cargar. ¡Código más limpio!)

  // 1. Si no hay sesión activa, patada al login
  if (!user) {
    return <Navigate to="/" replace />; // Ojo: pon "/login" si tu ruta inicial se llama así
  }

  // 2. Si tiene sesión pero su rol no está permitido en esta vista
  if (rolesPermitidos && !rolesPermitidos.includes(rol)) {
    // Enrutamiento inteligente (Mejor UX que la pantalla estática de error)
    if (rol === 'Muestreador') {
      return <Navigate to="/registro" replace />;
    } else {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Si pasa todo, le mostramos el componente
  return children;
};