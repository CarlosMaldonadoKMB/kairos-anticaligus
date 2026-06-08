import { useState, useEffect } from 'react';
import { supabase } from '../db/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
// Ajusta la ruta de importación de tu base de datos local según tu proyecto
import { db } from '../db/kairosDb';

const Navbar = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // 1. Escuchar la cola de Dexie en tiempo real
  // Asumimos que tu tabla local se llama 'conteos' (Ajusta el nombre si es distinto)
  const pendingCount = useLiveQuery(
    () => db.conteos.count() 
  ) || 0;

  useEffect(() => {
    // 2. Detectar si el celular recupera o pierde la señal de internet
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Obtener el correo del usuario logueado
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setEmail(user.email);
    };
    getUser();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 text-white p-4 flex justify-between items-center border-b border-slate-700">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-teal-400">Kairos</h1>
        
        {/* SEMÁFORO DE SINCRONIZACIÓN */}
        <div className="flex items-center text-sm font-medium px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 shadow-inner">
          {pendingCount > 0 ? (
            <>
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
              <span className="text-orange-400">{pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full mr-2 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              <span className="text-green-400">Sincronizado ✓</span>
            </>
          )}
          {/* Advertencia secundaria de red para dar más contexto al operario */}
          {!isOnline && <span className="ml-2 pl-2 border-l border-slate-600 text-slate-500 text-xs uppercase tracking-wider">Offline</span>}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-300 hidden md:inline">{email}</span>
        <button 
          onClick={handleLogout}
          className="text-sm bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded border border-slate-600 transition-colors focus:ring-2 focus:ring-teal-500 focus:outline-none"
        >
          Salir
        </button>
      </div>
    </nav>
  );
};

export default Navbar;