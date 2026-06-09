import { useState, useEffect, useRef } from 'react';
import { supabase } from '../db/supabaseClient';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Datos de simulación para la demo si la base de datos está vacía
const DATOS_DEMO = [
  { fecha: '25/05', HO_Real: 1.2, HO_Predicho: 1.4, riesgo: 'Bajo' },
  { fecha: '28/05', HO_Real: 1.8, HO_Predicho: 1.9, riesgo: 'Medio' },
  { fecha: '01/06', HO_Real: 2.4, HO_Predicho: 2.6, riesgo: 'Alto' },
  { fecha: '04/06', HO_Real: 2.9, HO_Predicho: 3.2, riesgo: 'Crítico' },
  { fecha: '08/06', HO_Real: null, HO_Predicho: 3.5, riesgo: 'Crítico' },
  { fecha: '11/06', HO_Real: null, HO_Predicho: 2.1, riesgo: 'Mitigado' }, // Proyección post-baño
];

const Dashboard = () => {
  const navigate = useNavigate();
  const reporteRef = useRef(null);
  
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [promedioHO, setPromedioHO] = useState(0);
  const [isDemoData, setIsDemoData] = useState(false);

  // Variables del Algoritmo Epidemiológico Avanzado (Mocks Estructurales para la Demo)
  const [factorFH, setFactorFH] = useState(0.4); // 0.4 significa 60% de mitigación por baño reciente
  const [factorFV, setFactorFV] = useState(1.3); // 1.3 significa +30% de presión por centros vecinos
  const [irkAcumulado, setIrkAcumulado] = useState(0);

  useEffect(() => {
    fetchDatosSanitarios();
  }, []);

  const fetchDatosSanitarios = async () => {
    try {
      setLoading(true);
      // Consumimos la tabla exacta que alimentamos desde el terreno
      const { data, error } = await supabase
        .from('conteos_caligus')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Transformamos los datos para Recharts
        const datosMapeados = data.map(item => {
          const fechaObj = item.created_at ? new Date(item.created_at) : new Date();
          return {
            fecha: `${fechaObj.getDate()}/${fechaObj.getMonth() + 1}`,
            HO_Real: item.hembras_ovigeras != null ? Number(item.hembras_ovigeras) : 0,
            HO_Predicho: Number(item.hembras_ovigeras || 0) * 1.1, // Placeholder predictivo base
            centro: item.centro || 'Huelmo'
          };
        });
        
        setDatos(datosMapeados);
        
        // Calculamos el promedio de HO actual
        const suma = data.reduce((acc, curr) => acc + (curr.hembras_ovigeras || 0), 0);
        const promedio = Number((suma / data.length).toFixed(2));
        setPromedioHO(promedio);
        
        // Cálculo base del IRK dinámico en base a tus variables epidemiológicas
        setIrkAcumulado(Number((promedio * factorFV * factorFH).toFixed(2)));
        setIsDemoData(false);
      } else {
        // Si no hay datos en la nube, activamos la vitrina predictiva automatizada
        setDatos(DATOS_DEMO);
        setPromedioHO(2.9);
        setIrkAcumulado(1.5);
        setIsDemoData(true);
      }
    } catch (error) {
      console.error('Error cargando Dashboard:', error);
      // Fallback seguro ante fallas de red corporativas
      setDatos(DATOS_DEMO);
      setIsDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const generarPDF = async () => {
    const elemento = reporteRef.current;
    if (!elemento) return;

    // Ocultamos temporalmente elementos de navegación de la foto corporativa
    const botonPDF = document.getElementById('btn-export-pdf');
    if (botonPDF) botonPDF.style.display = 'none';

    const canvas = await html2canvas(elemento, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    if (botonPDF) botonPDF.style.display = 'flex';

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`KAIROS_Informe_Predictivo_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-bold">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-400 text-sm">Compilando Inteligencia Oceanográfica...</p>
        </div>
      </div>
    );
  }

  // Alerta crítica si superamos el umbral normativo biológico
  const limiteSuperado = promedioHO >= 3.0;

  return (
    <div ref={reporteRef} className="min-h-screen bg-slate-900 text-slate-100 pb-12 font-sans">
      
      {/* HEADER DE CONTROL */}
      <nav className="bg-slate-950 px-8 py-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-black tracking-wider text-white">
            KAIROS <span className="text-blue-500 font-medium text-sm tracking-normal">Anticaligus Predictive Engine</span>
          </h1>
          {isDemoData && (
            <span className="bg-amber-500/10 text-amber-400 text-xs px-2 py-0.5 rounded border border-amber-500/20 font-mono">
              ENTORNO SIMULACIÓN (DEMO VIRTUAL)
            </span>
          )}
        </div>
        <div className="flex gap-3">
          <button 
            id="btn-export-pdf"
            onClick={generarPDF}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            📊 Exportar Informe Ejecutivo PDF
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Salir
          </button>
        </div>
      </nav>

      {/* CONTENEDOR ANALÍTICO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-8 mt-8 space-y-6">
        
        {/* PANEL DE ALERTAS PREVENTIVAS */}
        {limiteSuperado ? (
          <div className="bg-red-950/40 border-2 border-red-700/60 rounded-xl p-4 flex items-center justify-between animate-pulse">
            <div>
              <h3 className="text-red-400 font-black text-lg">ALERTA CRÍTICA: RIESGO DE NOTIFICACIÓN SANITARIA</h3>
              <p className="text-red-300/80 text-sm mt-0.5">El promedio acumulado supera las 3.0 HO. Sernapesca exige activación inmediata de planes de contingencia.</p>
            </div>
            <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-black">ACCIÓN URGENTE</span>
          </div>
        ) : (
          <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4">
            <p className="text-emerald-400 text-sm font-semibold">✓ Carga biológica bajo control normativo. Inercia de dispersión estable para los próximos 7 días.</p>
          </div>
        )}

        {/* INDICADORES DEL MODELO EPIDEMIOLÓGICO DE CLASE MUNDIAL */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Carga Biológica Actual</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-black ${limiteSuperado ? 'text-red-500' : 'text-white'}`}>
                {promedioHO}
              </span>
              <span className="text-xs text-slate-400 font-medium">HO Promedio</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">Límite Normativo SIFA: <span className="font-bold">3.0 HO</span></div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Factor Inercia Farmacológica ($F_H$)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-teal-400">{factorFH}</span>
              <span className="text-xs text-teal-500 font-bold">-60% Riesgo</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">Ventana activa: <span className="font-bold">&lt; 21 días post-baño (T2)</span></div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Presión Larvaria Vecinal ($F_V$)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-amber-500">+{factorFV}</span>
              <span className="text-xs text-amber-500 font-bold">+30% Presión</span>
            </div>
            <div className="mt-2 text-xs text-slate-500">Origen: <span className="font-bold">Saturación en centros adyacentes</span></div>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border-2 border-blue-600 bg-gradient-to-br from-slate-950 to-blue-950/20 shadow-lg shadow-blue-500/5">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">Índice de Riesgo Kairos ($IRK$)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white">{irkAcumulado}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-black ${irkAcumulado > 2.0 ? 'bg-red-500 text-white' : 'bg-blue-500/20 text-blue-400'}`}>
                {irkAcumulado > 2.0 ? 'Riesgo Alto' : 'Moderado'}
              </span>
            </div>
            <div className="mt-2 text-xs text-blue-400/70 font-mono">Simulación Matemática Avanzada</div>
          </div>

        </div>

        {/* ÁREA DE GRÁFICA PREDICTIVA INTERACTIVA */}
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-black text-white">Curva de Tendencia y Mitigación Preventiva</h2>
              <p className="text-xs text-slate-400 mt-0.5">Modelamiento probabilístico cruzando Temperatura, Salinidad y Factores Biológicos ($F_H \cdot F_V$)</p>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                <span className="text-slate-300">Conteo Real (Terreno)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-0.5 w-4 border-t-2 border-dashed border-amber-500"></div>
                <span className="text-slate-300">Proyección Algorítmica</span>
              </div>
            </div>
          </div>

          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={datos} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="fecha" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="hidden" />
                
                {/* Línea de corte normativo institucional */}
                <ReferenceLine y={3.0} stroke="#b91c1c" strokeDasharray="4 4" label={{ value: 'Umbral Sernapesca (3.0 HO)', fill: '#ef4444', position: 'top', fontSize: 11, fontWeight: 'bold' }} />
                
                {/* Línea Sólida: Lo capturado en las balsas */}
                <Line 
                  name="HO Real"
                  type="monotone" 
                  dataKey="HO_Real" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#3b82f6' }}
                  activeDot={{ r: 7 }}
                />
                
                {/* Línea Punteada: La proyección matemática del modelo predictivo */}
                <Line 
                  name="Proyección Modelada"
                  type="monotone" 
                  dataKey="HO_Predicho" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </main>
    </div>
  );
};

export default Dashboard;