import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button } from './ui';
import { Copy, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Configuración de API usando variable de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const DuplicarJornada = ({ 
  jornada, 
  onClose, 
  className = "" 
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fechaDuplicacion, setFechaDuplicacion] = useState(() => {
    // Por defecto usar la fecha de hoy
    const hoy = new Date();
    return `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
  });

  // Función para transformar los datos de la jornada original a formato compatible
  const transformarJornadaParaDuplicacion = async (jornadaOriginal) => {
    if (!jornadaOriginal || !jornadaOriginal.registros) {
      return [];
    }

    const actividadesTransformadas = [];

    for (const actividad of jornadaOriginal.registros) {
      const actividadTransformada = {
        oti: actividad.oti?.numeroOti || '',
        areaProduccion: actividad.areaProduccion?._id || '',
        procesos: actividad.procesos?.map(p => p._id) || [],
        maquina: actividad.maquina?.map(m => m._id) || [],
        insumos: actividad.insumos?.map(i => i._id) || [],
        tipoTiempo: actividad.tipoTiempo || '',
        horaInicio: actividad.horaInicio 
          ? new Date(actividad.horaInicio).toLocaleTimeString("en-GB", { 
              hour: "2-digit", 
              minute: "2-digit", 
              hour12: false 
            })
          : '',
        horaFin: actividad.horaFin 
          ? new Date(actividad.horaFin).toLocaleTimeString("en-GB", { 
              hour: "2-digit", 
              minute: "2-digit", 
              hour12: false 
            })
          : '',
        observaciones: actividad.observaciones || '',
        // 🔧 MEJORADO: Obtener procesos disponibles para cada área
        availableProcesos: [],
        // Información para mostrar nombres en lugar de IDs
        areaNombre: actividad.areaProduccion?.nombre || '',
        procesosNombres: actividad.procesos?.map(p => p.nombre) || [],
        maquinasNombres: actividad.maquina?.map(m => m.nombre) || [],
        insumosNombres: actividad.insumos?.map(i => i.nombre) || []
      };

      // 🚀 Cargar procesos disponibles para el área de esta actividad
      if (actividad.areaProduccion?._id) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/procesos?areaId=${actividad.areaProduccion._id}`);
          if (response.ok) {
            const data = await response.json();
            let procesosDisponibles = Array.isArray(data) ? data : (data.procesos || []);
            actividadTransformada.availableProcesos = procesosDisponibles;
          } else {
            console.warn(`⚠️ No se pudieron cargar procesos para área ${actividad.areaProduccion.nombre}`);
          }
        } catch (error) {
          console.error(`❌ Error al cargar procesos para área ${actividad.areaProduccion?.nombre}:`, error);
        }
      }

      actividadesTransformadas.push(actividadTransformada);
    }

    return actividadesTransformadas;
  };

  const handleDuplicar = async () => {
    setLoading(true);
    
    try {
      // Validar fecha
      if (!fechaDuplicacion) {
        toast.error('Por favor selecciona una fecha para la nueva jornada.');
        setLoading(false);
        return;
      }

      // Transformar los datos de la jornada
      const actividadesTransformadas = await transformarJornadaParaDuplicacion(jornada);
      
      if (actividadesTransformadas.length === 0) {
        toast.error('No hay actividades para duplicar en esta jornada.');
        setLoading(false);
        return;
      }

      // Guardar los datos en localStorage para que el componente RegistroProduccion los tome
      const datosJornadaDuplicada = {
        fechaDuplicacion: fechaDuplicacion,
        actividadesDuplicadas: actividadesTransformadas,
        jornadaOriginalId: jornada._id,
        fechaOriginal: jornada.fecha
      };

      localStorage.setItem('jornadaDuplicada', JSON.stringify(datosJornadaDuplicada));

      // Mensaje de confirmación
      toast.success(`¡Jornada preparada para duplicación! Te redirigimos al registro de producción.`, {
        position: "bottom-right",
        autoClose: 3000,
      });

      // Cerrar modal si existe
      if (onClose) {
        onClose();
      }

      // Navegar a registro de producción con parámetro especial
      navigate('/registro-produccion?duplicar=true');

    } catch (error) {
      console.error('Error al duplicar jornada:', error);
      toast.error('Error al preparar la duplicación de la jornada. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Calcular estadísticas de la jornada
  const totalActividades = jornada?.registros?.length || 0;
  const tiempoTotal = jornada?.totalTiempoActividades;
  const fechaOriginal = jornada?.fecha ? new Date(jornada.fecha).toLocaleDateString() : 'N/A';

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-700 text-white p-6 rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Copy className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Duplicar Jornada</h2>
            <p className="text-blue-100 text-sm">
              Crea una nueva jornada basada en los datos existentes
            </p>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-6">
        {/* Información de la jornada original */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="text-lg font-semibold text-black mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-700" />
            Jornada Original
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-black" />
              <span className="text-black">Fecha:</span>
              <span className="font-medium">{fechaOriginal}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-black" />
              <span className="text-black">Actividades:</span>
              <span className="font-medium">{totalActividades}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-black" />
              <span className="text-black">Tiempo Total:</span>
              <span className="font-medium">
                {tiempoTotal && typeof tiempoTotal.horas === 'number' && typeof tiempoTotal.minutos === 'number'
                  ? `${tiempoTotal.horas}h ${tiempoTotal.minutos}m`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Selector de fecha para la nueva jornada */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-black flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            Nueva Jornada
          </h3>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Fecha para la jornada duplicada:
            </label>
            <input
              type="date"
              value={fechaDuplicacion}
              onChange={(e) => setFechaDuplicacion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              disabled={loading}
            />
          </div>
        </div>

        {/* Vista previa de lo que se va a duplicar */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-semibold- text-black mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-700" />
            ¿Qué se duplicará?
          </h4>
          <ul className="text-sm text-black space-y-1">
            <li>• Todas las actividades ({totalActividades}) con sus configuraciones</li>
            <li>• OTIs, procesos, áreas, máquinas e insumos</li>
            <li>• Tipos de tiempo y observaciones</li>
            <li>• Horarios (que podrás modificar en el siguiente paso)</li>
          </ul>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <strong>Nota:</strong> Podrás editar todos los campos (fechas, horas, etc.) antes de guardar la nueva jornada.
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            // cambiar color
            onClick={handleDuplicar}
            disabled={loading || !fechaDuplicacion}
            className="order-1 sm:order-2 bg-gradient-to-r from-teal-400 to-teal-600 border-emerald-200/40  text-white font-semibold px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto transform hover:scale-105"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Preparando...
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Duplicar Jornada
              </>
            )}
          </Button>
          
          {onClose && (
            <Button
              onClick={onClose}
              disabled={loading}
              variant="outline"
              className="order-1 sm:order-2 bg-gradient-to-r from-red-400 to-red-600  text-white font-semibold px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto transform hover:scale-105"
            >
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DuplicarJornada;
