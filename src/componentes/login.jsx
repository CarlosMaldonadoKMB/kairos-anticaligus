import { useState } from 'react';
import { supabase } from "../db/supabaseClient";
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
      setLoading(false);
    } else {
      navigate('/terreno');
    }
  };

  const handleRegistro = async () => {
    setLoading(true);
    setMensaje({ tipo: '', texto: '' });

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMensaje({ tipo: 'error', texto: error.message });
    } else {
      setMensaje({ tipo: 'exito', texto: 'Cuenta creada. Ya puedes iniciar sesión.' });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-teal-400 mb-2">Kairos Anticaligus</h1>
          <p className="text-slate-400 text-sm">Portal de Seguridad Industrial</p>
        </div>

        {mensaje.texto && (
          <div className={`p-3 rounded-md mb-4 text-sm font-bold ${mensaje.tipo === 'error' ? 'bg-red-900/50 text-red-200 border border-red-700' : 'bg-green-900/50 text-green-200 border border-green-700'}`}>
            {mensaje.texto}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Correo Corporativo</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded bg-slate-900 text-white border border-slate-600 focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-bold mb-2">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-slate-900 text-white border border-slate-600 focus:border-teal-500 focus:outline-none"
              required
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-teal-600 text-white font-bold py-3 px-4 rounded hover:bg-teal-500 active:bg-teal-700 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Iniciar Sesión'}
            </button>
            
            <button 
              type="button"
              onClick={handleRegistro}
              disabled={loading}
              className="w-full bg-transparent border-2 border-slate-600 text-slate-300 font-bold py-3 px-4 rounded hover:border-slate-500 active:bg-slate-700 disabled:opacity-50"
            >
              Solicitar Nueva Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;