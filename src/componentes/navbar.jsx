import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../db/supabaseClient';
import { LogOut, LayoutDashboard, ClipboardList } from 'lucide-react';

export default function Navbar() {
  const { rol, session } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center mb-6">
      <div className="flex items-center gap-4 sm:gap-8 max-w-6xl mx-auto w-full">
        <span className="font-bold text-teal-400 text-xl tracking-wide">Kairos</span>
        
        <div className="flex gap-4 sm:gap-6 flex-1">
          <Link to="/terreno" className="flex items-center gap-2 hover:text-teal-300 transition text-sm sm:text-base">
            <ClipboardList size={18} /> <span className="hidden sm:inline">Terreno</span>
          </Link>
          
          {(rol === 'gerente_salud' || rol === 'veterinario') && (
            <Link to="/dashboard" className="flex items-center gap-2 hover:text-teal-300 transition text-sm sm:text-base">
              <LayoutDashboard size={18} /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden md:block">{session?.user?.email}</span>
          <button onClick={handleLogout} className="text-slate-300 hover:text-red-400 transition flex items-center gap-2" title="Cerrar Sesión">
            <LogOut size={20} /> <span className="hidden sm:inline text-sm">Salir</span>
          </button>
        </div>
      </div>
    </nav>
  );
}