import React from 'react';
import { AlertTriangle, FileText, X } from 'lucide-react';

export const ContingencyModal = ({ isOpen, onClose, centro }) => {
  if (!isOpen) return null;

  const handleGenerarBorrador = () => {
    alert("Generando borrador de Reporte de Tratamiento para Sernapesca...");
    // Aquí iría la lógica futura para exportar el DOCX/PDF normativo
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm no-imprimir">
      <div className="relative w-full max-w-2xl rounded-xl border border-rose-500/30 bg-slate-900 p-8 shadow-2xl shadow-rose-900/20">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-white"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Encabezado */}
        <div className="mb-6 flex items-center gap-4">
          <div className="rounded-full bg-rose-500/20 p-3 text-rose-500">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Plan de Contingencia Activado</h2>
            <p className="text-rose-400">Límite Normativo Sernapesca Superado en {centro}</p>
          </div>
        </div>

        <hr className="my-6 border-slate-800" />

        {/* Pasos de Acción */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Acciones Inmediatas Sugeridas:</h3>
          <ol className="list-inside list-decimal space-y-3 text-slate-300">
            <li><strong className="text-white">Aislar unidad de cultivo:</strong> Suspender movimiento de redes en jaulas afectadas.</li>
            <li><strong className="text-white">Notificación Interna:</strong> Enviar reporte automático a Gerencia de Salud y Centro Veterinario.</li>
            <li><strong className="text-white">Preparar logística de baño:</strong> Verificar stock de Peróxido de Hidrógeno o Azametifos.</li>
            <li><strong className="text-white">Notificación Normativa:</strong> Tienes 48 horas hábiles para enviar la notificación oficial a la autoridad.</li>
          </ol>
        </div>

        <div className="mt-8 flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            Cerrar Panel
          </button>
          <button 
            onClick={handleGenerarBorrador}
            className="flex items-center gap-2 rounded-lg bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-500 shadow-lg shadow-rose-500/30"
          >
            <FileText className="h-4 w-4" />
            Generar Borrador Sernapesca
          </button>
        </div>

      </div>
    </div>
  );
};