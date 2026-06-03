import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [rol, setRol] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Buscar sesión activa al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) obtenerRol(session.user.id);
      else setLoading(false);
    });

    // 2. Escuchar cuando alguien inicia o cierra sesión
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        obtenerRol(session.user.id);
      } else {
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
      console.error("Error obteniendo rol:", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, rol, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);