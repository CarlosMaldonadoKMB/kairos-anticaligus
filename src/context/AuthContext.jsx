import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "../db/supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Más directo y limpio para consumir en componentes
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true); // Actúa como un candado inicial

  useEffect(() => {
    // 1. Buscar sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        obtenerRol(session.user.id);
      } else {
        setLoading(false); // Destrabamos rápido si no hay nadie logueado
      }
    });

    // 2. Escuchar cuando alguien inicia o cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        obtenerRol(session.user.id);
      } else {
        setUser(null);
        setRol(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const obtenerRol = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      if (data) setRol(data.rol);
    } catch (error) {
      console.error("Error obteniendo rol de seguridad:", error.message);
    } finally {
      // TRUCO MAESTRO: Solo cuando tenemos el rol, liberamos la aplicación
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, rol, loading }}>
      {/* El candado: No muestra las pantallas hasta terminar el chequeo */}
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);