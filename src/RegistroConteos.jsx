import { useEffect, useState } from 'react'
import { Trash2, Wifi, WifiOff } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import * as XLSX from 'xlsx'
import { db } from './db/kairosDb'
import { supabase } from './db/supabaseClient'
import { useAuth } from './context/AuthContext';

// --- Constantes mock ---
const CENTROS = ['Huelmo', 'Pargua', 'Quitralco']
const JAULAS = ['101', '102', '103', '104']
const TRATAMIENTOS = [
  { value: 'TN', label: 'TN (Sin Tratamiento)' },
  { value: 'T1', label: 'T1 (Adultos)' },
  { value: 'T2', label: 'T2 (Juveniles)' },
  { value: 'T3', label: 'T3 (Ambos)' },
]

const MENSAJE_EXITO = 'Conteo guardado en la base de datos local'
const DURACION_TOAST_MS = 3500

function formatearFechaHistorial(iso) {
  try {
    return new Date(iso).toLocaleString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

/** Fecha oficial SIFA: DD/MM/AAAA (sin hora). */
function formatearFechaSIFA(iso) {
  try {
    const d = new Date(iso)
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yyyy = d.getFullYear()
    return `${dd}/${mm}/${yyyy}`
  } catch {
    return iso
  }
}

/** RUT sin puntos, con guion (ej. 12345678-9) para validadores externos. */
function sanitizarRut(rut) {
  if (rut == null || rut === '') return ''
  return String(rut).replace(/\./g, '').trim()
}

// --- Primitivos UI (estilo shadcn, solo Tailwind) ---

function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${className}`}
    >
      {children}
    </div>
  )
}

function CardTitle({ children, className = '' }) {
  return (
    <h2 className={`text-gray-900 font-semibold text-lg mb-3 ${className}`}>
      {children}
    </h2>
  )
}

function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-gray-900 mb-1"
    >
      {children}
    </label>
  )
}

function Select({ id, value, onChange, options }) {
  const normalizadas = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  )
  return (
    <select
      id={id}
      value={value}
      onChange={onChange}
      className="w-full h-12 px-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-md touch-manipulation focus:outline-none focus:border-gray-900"
    >
      {normalizadas.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

function Input({ id, type = 'text', value, onChange, placeholder, min, step }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      min={min}
      step={step}
      className="w-full max-w-full h-12 px-3 text-base text-gray-900 bg-white border-2 border-gray-300 rounded-md touch-manipulation focus:outline-none focus:border-gray-900 placeholder:text-gray-500 box-border"
    />
  )
}

function Button({
  children,
  onClick,
  variant = 'default',
  className = '',
  type = 'button',
  disabled = false,
}) {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-md touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50'
  const variants = {
    default: 'bg-gray-900 text-white hover:bg-gray-800',
    outline:
      'bg-white text-gray-900 border-2 border-gray-400 hover:bg-gray-50 active:bg-gray-100',
    physical:
      'bg-gray-200 text-gray-900 border-2 border-gray-400 shadow-sm hover:bg-gray-300 active:bg-gray-400',
    danger:
      'bg-red-600 text-white border-2 border-red-700 hover:bg-red-700 active:bg-red-800',
    teal:
      'bg-teal-700 text-white border-2 border-teal-800 hover:bg-teal-800 active:bg-teal-900',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}

// --- Sub-componente: contador parasitario por categoría ---

function ContadorCategoria({
  titulo,
  valor,
  onIncrement,
  onDecrement,
  onChange,
  destacado = false,
}) {
  const handleInputChange = (e) => {
    const raw = e.target.value
    if (raw === '') {
      onChange(0)
      return
    }
    const parsed = parseInt(raw, 10)
    if (!Number.isNaN(parsed) && parsed >= 0) {
      onChange(parsed)
    }
  }

  const cardClass = destacado
    ? 'border-4 border-red-600 bg-red-50 shadow-md'
    : 'border border-gray-200 bg-white'

  // Botones físicos compactos: no desbordan la tarjeta en móvil
  const botonFisicoClass =
    'h-16 w-16 min-h-16 min-w-16 max-h-16 max-w-16 shrink-0 text-3xl p-0 box-border'

  return (
    <Card className={`overflow-hidden ${cardClass}`}>
      <div className="flex flex-col gap-1 mb-4">
        <span className="text-gray-900 font-semibold text-lg">{titulo}</span>
        {destacado && (
          <span className="text-sm font-bold text-red-800 uppercase tracking-wide">
            Indicador crítico Sernapesca
          </span>
        )}
      </div>
      <div className="flex w-full max-w-full min-w-0 items-center justify-between gap-2 sm:gap-4 box-border">
        <Button
          variant="physical"
          onClick={onDecrement}
          className={botonFisicoClass}
          aria-label={`Disminuir ${titulo}`}
        >
          −
        </Button>
        <input
          type="number"
          min={0}
          value={valor}
          onChange={handleInputChange}
          className="h-16 w-24 max-w-[6rem] shrink-0 box-border text-center text-3xl font-black text-gray-900 bg-white border-2 border-gray-300 rounded-lg touch-manipulation focus:outline-none focus:border-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={`Cantidad ${titulo}`}
        />
        <Button
          variant="physical"
          onClick={onIncrement}
          className={botonFisicoClass}
          aria-label={`Aumentar ${titulo}`}
        >
          +
        </Button>
      </div>
    </Card>
  )
}

// --- Vista principal ---

export default function RegistroConteos() {
  const { session } = useAuth(); // <--- Agrega esta línea
  
  const [centro, setCentro] = useState('Huelmo')
  const [jaula, setJaula] = useState('101')
  const [rutMuestreador, setRutMuestreador] = useState('')
  const [codigoRNA, setCodigoRNA] = useState('')
  const [densidadCultivo, setDensidadCultivo] = useState('')
  const [tratamiento, setTratamiento] = useState('TN')
  const [principioActivo, setPrincipioActivo] = useState('')
  const [pecesMuestreados, setPecesMuestreados] = useState(20)
  const [pesoPromedio, setPesoPromedio] = useState('')
  const [juveniles, setJuveniles] = useState(0)
  const [adultosMoviles, setAdultosMoviles] = useState(0)
  const [hembrasOvigeras, setHembrasOvigeras] = useState(0)
  const [temperatura, setTemperatura] = useState('')
  const [salinidad, setSalinidad] = useState('')
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [guardando, setGuardando] = useState(false)
  const [mensajeExito, setMensajeExito] = useState('')
  const [eliminandoId, setEliminandoId] = useState(null)
  const [exportando, setExportando] = useState(false)

  const historial = useLiveQuery(() => db.conteos.toArray())

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!mensajeExito) return
    const timer = window.setTimeout(() => setMensajeExito(''), DURACION_TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [mensajeExito])

  const fechaFormateada = new Date().toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const parseNumeroOpcional = (valor) => {
    if (valor === '' || valor == null) return null
    const n = parseFloat(valor)
    return Number.isNaN(n) ? null : n
  }

  const handleSave = async () => {
    const fecha = new Date().toISOString()

    const registro = {
      operario: session?.user?.email,
      fecha,
      centro,
      jaula,
      rutMuestreador: rutMuestreador.trim(),
      codigoRNA: codigoRNA.trim(),
      pecesMuestreados: Number(pecesMuestreados),
      pesoPromedio: parseNumeroOpcional(pesoPromedio),
      juveniles,
      adultosMoviles,
      hembrasOvigeras,
      temperatura: parseNumeroOpcional(temperatura),
      salinidad: parseNumeroOpcional(salinidad),
      densidadCultivo: parseNumeroOpcional(densidadCultivo),
      tratamiento,
      principioActivo: principioActivo.trim() || null,
      conexionEnGuardado: isOnline,
    }

    try {
      setGuardando(true)
      const id = await db.conteos.add(registro)
      console.log(
        JSON.stringify({ id, ...registro }, null, 2)
      )
      setMensajeExito(MENSAJE_EXITO)

      if (navigator.onLine) {
        try {
          const densidadNum = parseNumeroOpcional(densidadCultivo)
          const { error } = await supabase.from('conteos_caligus').insert({
            rut_muestreador: rutMuestreador.trim(),
            codigo_rna: codigoRNA.trim(),
            densidad_cultivo:
              densidadNum != null ? Number(densidadNum) : null,
            tratamiento,
            conteo_total: juveniles + adultosMoviles + hembrasOvigeras,
          })

          if (error) throw error
          console.log('Conteo sincronizado con Supabase correctamente.')
        } catch (supabaseError) {
          console.log(
            'Guardado local exitoso. No se pudo sincronizar con Supabase (offline o error de red):',
            supabaseError?.message ?? supabaseError
          )
        }
      } else {
        console.log(
          'Sin conexión: conteo guardado solo en base de datos local.'
        )
      }
    } catch (error) {
      console.error('Error al guardar en KairosDB:', error)
      window.alert(
        `No se pudo guardar el conteo: ${error?.message ?? 'Error desconocido'}`
      )
    } finally {
      setGuardando(false)
    }
  }

  const exportarToExcelSIFA = async () => {
    try {
      // 1. Extraer los datos reales desde tu tabla 'conteos'
      const registrosLocales = await db.conteos.toArray(); 
  
      if (registrosLocales.length === 0) {
        alert("No hay registros guardados para exportar.");
        return;
      }
  
      // 2. Transformar los datos al formato normativo estricto del SIFA
      const datosFormateados = registrosLocales.map(reg => {
        // Limpieza de Fecha usando tu variable 'reg.fecha'
        const dateObj = new Date(reg.fecha || Date.now());
        const dia = String(dateObj.getDate()).padStart(2, '0');
        const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
        const anio = dateObj.getFullYear();
        const fechaLimpia = `${dia}/${mes}/${anio}`;
  
        // Sanitizar RUT (Quitar los puntos pero conservar el guion)
        const rutSanitizado = reg.rutMuestreador ? reg.rutMuestreador.replace(/\./g, '') : '';
  
        return {
          "Fecha Conteo": fechaLimpia,
          "RUT Muestreador": rutSanitizado,
          "Código RNA del Centro": reg.centro || 'N/A', // Mapeado a tu campo 'centro'
          "Número de Jaula": reg.jaula || 'N/A',        // Mapeado a tu campo 'jaula'
          "Densidad de Cultivo": Number(reg.densidadCultivo || 0),
          "Esquema Tratamiento": reg.tratamiento || 'TN',
          "Caligus Juveniles": Number(reg.juveniles || 0),
          "Caligus Adultos Móviles": Number(reg.adultosMoviles || 0),
          "Hembras Ovígeras (HO)": Number(reg.hembrasOvigera || 0)
        };
      });
  
      // 3. Generar el archivo Excel binario usando SheetJS
      const hoja = XLSX.utils.json_to_sheet(datosFormateados);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, "Conteos SIFA");
  
      // 4. Descarga automática con la fecha del día
      const hoy = new Date().toISOString().split('T')[0];
      XLSX.writeFile(libro, `SIFA_Caligus_ANEXO_${hoy}.xlsx`);
  
      console.log("📥 Planilla SIFA generada con desgloses sanitarios exitosamente.");
    } catch (error) {
      console.error("❌ Error fatal al compilar el Excel:", error);
      alert("Hubo un problema al generar el Excel.");
    }
  };

  const handleEliminar = async (id) => {
    if (
      !window.confirm(
        '¿Eliminar este registro de la base de datos local? Esta acción no se puede deshacer.'
      )
    ) {
      return
    }
    try {
      setEliminandoId(id)
      await db.conteos.delete(id)
    } catch (error) {
      console.error('Error al eliminar registro:', error)
      window.alert(
        `No se pudo eliminar: ${error?.message ?? 'Error desconocido'}`
      )
    } finally {
      setEliminandoId(null)
    }
  }

  const incrementar = (setter, valor) => () => setter(valor + 1)
  const decrementar = (setter, valor) => () => setter(Math.max(0, valor - 1))

  const registrosOrdenados =
    historial?.slice().sort((a, b) => new Date(b.fecha) - new Date(a.fecha)) ??
    []

  return (
    <div className="max-w-lg mx-auto w-full px-4 pb-8 space-y-4 text-left text-gray-900 box-border">
      {/* Toast temporal de éxito */}
      {mensajeExito && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border-2 border-green-700 bg-green-100 px-4 py-3 text-center text-base font-bold text-green-900 shadow-lg"
        >
          {mensajeExito}
        </div>
      )}

      {/* Barra superior: contexto operario, fecha y red */}
      <Card className="flex flex-row items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Operario: {session?.user?.email}
          </p>
          <p className="text-sm text-gray-700 capitalize">{fechaFormateada}</p>
        </div>
        <div
          className="shrink-0"
          title={isOnline ? 'Conectado' : 'Sin conexión'}
          aria-label={isOnline ? 'Conectado' : 'Sin conexión'}
        >
          {isOnline ? (
            <Wifi className="h-8 w-8 text-gray-900" strokeWidth={2} />
          ) : (
            <WifiOff className="h-8 w-8 text-red-600" strokeWidth={2} />
          )}
        </div>
      </Card>

      {/* Sección 1: Ubicación */}
      <Card>
        <CardTitle>Ubicación</CardTitle>
        <div className="space-y-4">
          <div>
            <Label htmlFor="centro">Centro de Cultivo</Label>
            <Select
              id="centro"
              value={centro}
              onChange={(e) => setCentro(e.target.value)}
              options={CENTROS}
            />
          </div>
          <div>
            <Label htmlFor="jaula">Número de Jaula</Label>
            <Select
              id="jaula"
              value={jaula}
              onChange={(e) => setJaula(e.target.value)}
              options={JAULAS}
            />
          </div>
        </div>
      </Card>

      {/* Datos oficiales SIFA (Sernapesca) */}
      <Card className="border-2 border-blue-800 bg-blue-50/40">
        <CardTitle>Datos Oficiales SIFA</CardTitle>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rutMuestreador">RUT Muestreador Calificado</Label>
            <Input
              id="rutMuestreador"
              type="text"
              value={rutMuestreador}
              onChange={(e) => setRutMuestreador(e.target.value)}
              placeholder="Ej. 12.345.678-9"
            />
          </div>
          <div>
            <Label htmlFor="codigoRNA">Código RNA del Centro</Label>
            <Input
              id="codigoRNA"
              type="text"
              value={codigoRNA}
              onChange={(e) => setCodigoRNA(e.target.value)}
              placeholder="Ej. 12010001"
            />
          </div>
        </div>
      </Card>

      {/* Sección 2: Datos de muestra */}
      <Card>
        <CardTitle>Datos de Muestra</CardTitle>
        <div className="space-y-4">
          <div>
            <Label htmlFor="peces">Peces Muestreados</Label>
            <Input
              id="peces"
              type="number"
              min={1}
              value={pecesMuestreados}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (!Number.isNaN(v) && v >= 0) setPecesMuestreados(v)
              }}
            />
          </div>
          <div>
            <Label htmlFor="peso">Peso Promedio (kg)</Label>
            <Input
              id="peso"
              type="number"
              step="0.01"
              min={0}
              value={pesoPromedio}
              onChange={(e) => setPesoPromedio(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
      </Card>

      {/* Sección 3: Conteo parasitario (core) */}
      <div>
        <CardTitle>Conteo Parasitario</CardTitle>
        <div className="space-y-3">
          <ContadorCategoria
            titulo="Juveniles"
            valor={juveniles}
            onIncrement={incrementar(setJuveniles, juveniles)}
            onDecrement={decrementar(setJuveniles, juveniles)}
            onChange={setJuveniles}
          />
          <ContadorCategoria
            titulo="Adultos Móviles"
            valor={adultosMoviles}
            onIncrement={incrementar(setAdultosMoviles, adultosMoviles)}
            onDecrement={decrementar(setAdultosMoviles, adultosMoviles)}
            onChange={setAdultosMoviles}
          />
          <ContadorCategoria
            titulo="Hembras Ovígeras"
            valor={hembrasOvigeras}
            onIncrement={incrementar(setHembrasOvigeras, hembrasOvigeras)}
            onDecrement={decrementar(setHembrasOvigeras, hembrasOvigeras)}
            onChange={setHembrasOvigeras}
            destacado
          />
        </div>
      </div>

      {/* Sección 4: Variables ambientales */}
      <Card>
        <CardTitle>Variables Ambientales</CardTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <Label htmlFor="temperatura">Temperatura del Agua (°C)</Label>
            <Input
              id="temperatura"
              type="number"
              step="0.1"
              value={temperatura}
              onChange={(e) => setTemperatura(e.target.value)}
              placeholder="Ej. 12.5"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="salinidad">Salinidad (ppt)</Label>
            <Input
              id="salinidad"
              type="number"
              step="0.1"
              value={salinidad}
              onChange={(e) => setSalinidad(e.target.value)}
              placeholder="Ej. 32"
            />
          </div>
          <div className="min-w-0 sm:col-span-2">
            <Label htmlFor="densidadCultivo">Densidad de Cultivo (kg/m³)</Label>
            <Input
              id="densidadCultivo"
              type="number"
              step="0.1"
              min={0}
              value={densidadCultivo}
              onChange={(e) => setDensidadCultivo(e.target.value)}
              placeholder="Ej. 15.5"
            />
          </div>
        </div>
      </Card>

      {/* Acciones sanitarias (SIFA) */}
      <Card>
        <CardTitle>Acciones Sanitarias</CardTitle>
        <div className="space-y-4">
          <div>
            <Label htmlFor="tratamiento">Tratamiento Quincenal</Label>
            <Select
              id="tratamiento"
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
              options={TRATAMIENTOS}
            />
          </div>
          <div>
            <Label htmlFor="principioActivo">Principio Activo (Fármaco)</Label>
            <Input
              id="principioActivo"
              type="text"
              value={principioActivo}
              onChange={(e) => setPrincipioActivo(e.target.value)}
              placeholder="Opcional — Ej. Emamectina benzoato"
            />
          </div>
        </div>
      </Card>

      {/* Botón de acción principal */}
      <Button
        variant="default"
        onClick={handleSave}
        disabled={guardando}
        className="w-full h-14 text-lg font-bold"
      >
        {guardando ? 'Guardando…' : 'Guardar Conteo (Modo Offline)'}
      </Button>

      {/* Dashboard de historial offline */}
      <hr className="my-8 border-gray-300" />

      <section aria-labelledby="titulo-historial">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2
            id="titulo-historial"
            className="text-xl font-bold text-gray-900"
          >
            Historial de Registros Locales
          </h2>
          <Button
            variant="teal"
            onClick={exportarToExcelSIFA}
            disabled={exportando || historial === undefined}
            className="h-12 px-4 text-sm font-bold whitespace-nowrap"
          >
            {exportando ? 'Generando…' : '📥 Exportar Planilla SIFA'}
          </Button>
        </div>

        {historial === undefined ? (
          <p className="text-sm text-gray-500">Cargando historial…</p>
        ) : registrosOrdenados.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No hay registros guardados localmente
          </p>
        ) : (
          <>
            {/* Tabla en pantallas medianas/grandes */}
            <div className="hidden sm:block overflow-x-auto rounded-lg border-2 border-gray-300 bg-white">
              <table className="w-full text-left text-sm text-gray-900">
                <thead className="bg-gray-200 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-3 py-3 font-bold">Fecha</th>
                    <th className="px-3 py-3 font-bold">Centro</th>
                    <th className="px-3 py-3 font-bold">Jaula</th>
                    <th className="px-3 py-3 font-bold text-red-800">HO</th>
                    <th className="px-3 py-3 font-bold w-14" aria-label="Acciones">
                      <span className="sr-only">Eliminar</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registrosOrdenados.map((reg) => (
                    <tr
                      key={reg.id}
                      className="border-b border-gray-200 last:border-b-0"
                    >
                      <td className="px-3 py-3 whitespace-nowrap">
                        {formatearFechaHistorial(reg.fecha)}
                      </td>
                      <td className="px-3 py-3 font-medium">{reg.centro}</td>
                      <td className="px-3 py-3">{reg.jaula}</td>
                      <td className="px-3 py-3 font-black text-red-800">
                        {reg.hembrasOvigeras ?? 0}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => handleEliminar(reg.id)}
                          disabled={eliminandoId === reg.id}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-red-600 text-white border-2 border-red-700 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 touch-manipulation"
                          aria-label={`Eliminar registro ${reg.id}`}
                        >
                          <Trash2 className="h-5 w-5" strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas apiladas en móvil */}
            <div className="sm:hidden space-y-3">
              {registrosOrdenados.map((reg) => (
                <Card
                  key={reg.id}
                  className="border-2 border-gray-300 flex flex-row items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-medium text-gray-600">
                      {formatearFechaHistorial(reg.fecha)}
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {reg.centro} · Jaula {reg.jaula}
                    </p>
                    <p className="text-sm text-gray-800">
                      HO:{' '}
                      <span className="font-black text-red-800 text-lg">
                        {reg.hembrasOvigeras ?? 0}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleEliminar(reg.id)}
                    disabled={eliminandoId === reg.id}
                    className="shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-md bg-red-600 text-white border-2 border-red-700 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 touch-manipulation"
                    aria-label={`Eliminar registro ${reg.id}`}
                  >
                    <Trash2 className="h-6 w-6" strokeWidth={2.5} />
                  </button>
                </Card>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}


