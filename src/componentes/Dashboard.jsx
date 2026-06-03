import { useEffect, useState } from 'react';
import { supabase } from '../db/supabaseClient';
import Navbar from './navbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function Dashboard() {
  const [datosBrutos, setDatosBrutos] = useState([]);
  const [datosGrafico, setDatosGrafico] = useState([]);
  const [jaulaSeleccionada, setJaulaSeleccionada] = useState('Todas');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  // Volver a filtrar si el usuario cambia de jaula en el menú
  useEffect(() => {
    filtrarDatos();
  }, [jaulaSeleccionada, datosBrutos]);

  const cargarDatos = async () => {
    try {
      const { data, error } = await supabase
        .from('conteos_caligus')
        .select('created_at, hembras_ovigeras, jaula')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setDatosBrutos(data || []);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtrarDatos = () => {
    const filtrados = jaulaSeleccionada === 'Todas' 
      ? datosBrutos 
      : datosBrutos.filter(item => item.jaula === jaulaSeleccionada);

    const paraGrafico = filtrados.map(item => ({
      fecha: new Date(item.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' }),
      "Hembras Ovígeras (HO)": item.hembras_ovigeras || 0,
      jaula: item.jaula
    }));

    setDatosGrafico(paraGrafico);
  };

  // Obtener lista única de jaulas para el menú desplegable
  const jaulasUnicas = ['Todas', ...new Set(datosBrutos.map(d => d.jaula).filter(Boolean))];

  return (
    <div className="min-h-screen bg-slate-100 text-left">
      <Navbar /> {/* <-- Inyectamos la barra superior */}

      <div className="max-w-6xl mx-auto p-4 sm:p-0">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-slate-200">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-slate-800">Carga Parasitaria (Hembras Ovígeras)</h2>
            
            {/* Filtro por Jaula */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
              <label className="text-sm font-bold text-slate-700">Filtrar Jaula:</label>
              <select 
                value={jaulaSeleccionada} 
                onChange={(e) => setJaulaSeleccionada(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 text-sm rounded-md focus:ring-teal-500 focus:border-teal-500 block p-1.5"
              >
                {jaulasUnicas.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          </div>
          
          <div className="h-96 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500">Cargando métricas...</div>
            ) : datosGrafico.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                No hay datos de Hembras Ovígeras para graficar. Haz un ingreso en Terreno.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGrafico} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} tickMargin={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickMargin={10} domain={[0, 'dataMax + 1']} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  
                  {/* SEMÁFORO SERNAPESCA (Línea Roja 3.0) */}
                  <ReferenceLine 
                    y={3} 
                    label={{ position: 'top', value: 'Límite Sernapesca (3.0)', fill: '#dc2626', fontSize: 12, fontWeight: 'bold' }} 
                    stroke="#dc2626" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                  />

                  <Line 
                    type="monotone" 
                    dataKey="Hembras Ovígeras (HO)" 
                    stroke="#0d9488" 
                    strokeWidth={4}
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 8, fill: '#0d9488' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}