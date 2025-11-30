import { useState, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { Sidebar } from "../components/Sidebar";
import { Input, Textarea, Button, Card } from "../components/ui/index";
import Select from 'react-select';
import { plantillaActividades } from "../components/templates/PlantillasActividades";
import {
  Clock,
  Trash2,
  Save,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Copy,
  Moon,
  Timer,
  Zap,
  Plus
} from 'lucide-react';

// Configuración de API usando variable de entorno
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// Plantillas de actividades predefinidas editables
const PLANTILLAS_ACTIVIDADES = plantillaActividades;

// Componente separado para cada actividad
const ActividadCard = ({
  actividad,
  index,
  onActividadChange,
  onRemove,
  onDuplicate,
  areasProduccionData,
  maquinasData,
  insumosData,
  canRemove = false,
  triggerValidation = false,
  onValidationChange
}) => {
  const [tiempoCalculado, setTiempoCalculado] = useState(0);
  const [cruzaMedianoche, setCruzaMedianoche] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    procesos: false,
    insumos: false,
    maquina: false
  });
  const [showTooltips, setShowTooltips] = useState({
    procesos: false,
    insumos: false,
    maquina: false
  });

  // Calcular tiempo en tiempo real
  useEffect(() => {
    if (actividad.horaInicio && actividad.horaFin) {
      const inicio = new Date(`1970-01-01T${actividad.horaInicio}:00`);
      let fin = new Date(`1970-01-01T${actividad.horaFin}:00`);

      const esCruzaMedianoche = fin <= inicio;
      setCruzaMedianoche(esCruzaMedianoche);

      if (esCruzaMedianoche) {
        fin = new Date(`1970-01-02T${actividad.horaFin}:00`);
      }

      if (fin > inicio) {
        const minutos = Math.floor((fin - inicio) / 60000);
        setTiempoCalculado(minutos);
      } else {
        setTiempoCalculado(0);
      }
    } else {
      setTiempoCalculado(0);
      setCruzaMedianoche(false);
    }
  }, [actividad.horaInicio, actividad.horaFin]);

  const formatTiempo = (minutos) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}h ${mins}m`;
  };

  // Función para validar campos requeridos
  const validateField = (fieldName, value) => {
    const isEmpty = !value || (Array.isArray(value) && value.length === 0);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: isEmpty
    }));
    return !isEmpty;
  };

  // useEffect para manejar los cambios de validación de forma asíncrona
  useEffect(() => {
    if (onValidationChange) {
      const hasErrors = Object.values(validationErrors).some(error => error === true);
      onValidationChange(index, hasErrors);
    }
  }, [validationErrors, index]);

  // Función para mostrar tooltips de validación
  const showValidationTooltips = () => {
    const procesosEmpty = !actividad.procesos || actividad.procesos.length === 0;
    const insumosEmpty = !actividad.insumos || actividad.insumos.length === 0;
    const maquinasEmpty = !actividad.maquina || actividad.maquina.length === 0;

    setShowTooltips({
      procesos: procesosEmpty,
      insumos: insumosEmpty,
      maquina: maquinasEmpty
    });

    // Ocultar tooltips después de 3 segundos
    setTimeout(() => {
      setShowTooltips({
        procesos: false,
        insumos: false,
        maquina: false
      });
    }, 3000);
  };

  // Función para validar todos los campos
  const validateAllFields = () => {
    const procesosValid = validateField('procesos', actividad.procesos);
    const insumosValid = validateField('insumos', actividad.insumos);
    const maquinasValid = validateField('maquina', actividad.maquina);
    return procesosValid && insumosValid && maquinasValid;
  };

  // Manejar blur de campos Select
  const handleSelectBlur = (fieldName, value) => {
    validateField(fieldName, value);
    // Ocultar tooltip si se selecciona algo
    if (value && Array.isArray(value) && value.length > 0) {
      setShowTooltips(prev => ({
        ...prev,
        [fieldName]: false
      }));
    }
  };

  // Validar todos los campos cuando se dispara desde el componente padre
  useEffect(() => {
    if (triggerValidation) {
      validateAllFields();
      showValidationTooltips();
    }
  }, [triggerValidation]);

  return (
    <Card className="relative p-6 border-l-4 border-l-blue-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg border border-gray-100">
      {/* Header con gradiente */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-800">Actividad N° {index + 1}</h3>
              {actividad.oti === 'VR' && actividad.tipoTiempo && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Plantilla
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {actividad.oti === 'VR' && actividad.tipoTiempo
                ? "Actividad predefinida - Puedes editar cualquier campo"
                : "Registro de tiempo de producción"
              }
            </p>
          </div>
        </div>
        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {/* Botón para duplicar actividad */}
          <Button
            type="button"
            onClick={() => onDuplicate(index)}
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 hover:border-blue-300 h-9 w-9 p-0 rounded-lg transition-all duration-200"
            title="Duplicar actividad"
          >
            <Copy className="w-4 h-4" />
          </Button>
          {/* Botón para eliminar (solo si canRemove es true) */}
          {canRemove && (
            <Button
              type="button"
              onClick={() => onRemove(index)}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 h-9 w-9 p-0 rounded-lg transition-all duration-200"
              title="Eliminar actividad"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Sección de Información Básica */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-60 p-4 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                OTI *
              </label>
              <Input
                type="text"
                name="oti"
                value={actividad.oti || ""}
                onChange={(e) => onActividadChange(index, e)}
                placeholder="Número de OTI"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Área de Producción *
              </label>
              <Input
                as="select"
                name="areaProduccion"
                value={actividad.areaProduccion || ""}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar área...</option>
                {areasProduccionData.map(area => (
                  <option key={area._id} value={area._id}>{area.nombre}</option>
                ))}
              </Input>
            </div>
            <div className="space-y-2 relative">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Proceso(s) *
              </label>
              <div className="relative">
                <Select
                  isMulti
                  name="procesos"
                  options={actividad.availableProcesos?.map(p => ({ value: p._id, label: p.nombre })) || []}
                  value={actividad.procesos
                    ?.map(pId => {
                      const procesoInfo = actividad.availableProcesos?.find(ap => ap._id === pId);
                      return procesoInfo ? { value: procesoInfo._id, label: procesoInfo.nombre } : null;
                    })
                    .filter(p => p !== null) || []}
                  onChange={(selectedOptions, actionMeta) => {
                    onActividadChange(index, selectedOptions, actionMeta);
                    validateField('procesos', selectedOptions);
                    // Ocultar tooltip si se selecciona algo
                    if (selectedOptions && selectedOptions.length > 0) {
                      setShowTooltips(prev => ({
                        ...prev,
                        procesos: false
                      }));
                    }
                  }}
                  placeholder="Seleccionar proceso(s)..."
                  isDisabled={!actividad.areaProduccion}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '40px',
                      fontSize: '14px',
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      borderRadius: '8px',
                      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                      '&:hover': { borderColor: '#3b82f6' }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#eff6ff',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#1e40af',
                      fontSize: '12px'
                    })
                  }}
                  onBlur={() => handleSelectBlur('procesos', actividad.procesos)}
                />
                {showTooltips.procesos && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-30">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Completa este campo
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>

                Máquina *
              </label>
              <div className="relative">
                <Select
                  isMulti
                  name="maquina"
                  options={maquinasData.map(i => ({ value: i._id, label: i.nombre }))} // Solo máquinas activas
                  value={actividad.maquina
                    ?.map(mId => {
                      const maquinaInfo = maquinasData.find(ma => ma._id === mId);
                      return maquinaInfo ? { value: maquinaInfo._id, label: maquinaInfo.nombre } : null;
                    })
                    .filter(m => m !== null) || []}
                  onChange={(selectedOptions, actionMeta) => {
                    onActividadChange(index, selectedOptions, actionMeta);
                    validateField('maquina', selectedOptions);
                    if (selectedOptions && selectedOptions.length > 0) {
                      setShowTooltips(prev => ({
                        ...prev,
                        maquina: false
                      }));
                    }
                  }}
                  placeholder="Seleccionar maquina(s)..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '40px',
                      fontSize: '14px',
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      borderRadius: '8px',
                      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                      '&:hover': { borderColor: '#3b82f6' }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#f3e8ff',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#7c3aed',
                      fontSize: '12px'
                    })
                  }}
                  onBlur={() => handleSelectBlur('maquina', actividad.maquina)}
                />
                {showTooltips.maquina && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-30">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Completa este campo
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>

                Insumo(s) *
              </label>
              <div className="relative">
                <Select
                  isMulti
                  name="insumos"
                  options={insumosData.map(i => ({ value: i._id, label: i.nombre }))} // Solo insumos activos
                  value={actividad.insumos
                    ?.map(iId => {
                      const insumoInfo = insumosData.find(ins => ins._id === iId);
                      return insumoInfo ? { value: insumoInfo._id, label: insumoInfo.nombre } : null;
                    })
                    .filter(i => i !== null) || []}
                  onChange={(selectedOptions, actionMeta) => {
                    onActividadChange(index, selectedOptions, actionMeta);
                    validateField('insumos', selectedOptions);
                    // Ocultar tooltip si se selecciona algo
                    if (selectedOptions && selectedOptions.length > 0) {
                      setShowTooltips(prev => ({
                        ...prev,
                        insumos: false
                      }));
                    }
                  }}
                  placeholder="Seleccionar insumo(s)..."
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      minHeight: '40px',
                      fontSize: '14px',
                      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
                      borderRadius: '8px',
                      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
                      '&:hover': { borderColor: '#3b82f6' }
                    }),
                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: '#f3e8ff',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }),
                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#7c3aed',
                      fontSize: '12px'
                    })
                  }}
                  onBlur={() => handleSelectBlur('insumos', actividad.insumos)}
                />
                {showTooltips.insumos && (
                  <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-30">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-orange-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Completa este campo
                        </div>
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-orange-500"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Tipo de Tiempo *
              </label>
              <Input
                as="select"
                name="tipoTiempo"
                value={actividad.tipoTiempo || ""}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                required
              >
                <option value="">Seleccionar tipo...</option>
                <option value="Operación">Operación (tiempo dedicado a fabricar o transformar un producto)</option>
                <option value="Preparación">Preparación (Ej. limpieza, reuniones, alistamiento de herramientas)</option>
                <option value="Alimentación">Alimentación (Ej. desayuno, almuerzo)</option>
                <option value="Capacitación">Capacitación</option>
                <option value="Permiso Laboral">Permiso Laboral</option>
                <option value="Horario Laboral">Horario Laboral</option>
              </Input>
            </div>

            {/* Campo condicional para tipo de permiso */}
            {actividad.tipoTiempo === 'Permiso Laboral' && (
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Tipo de Permiso *
                </label>
                <Input
                  as="select"
                  name="tipoPermiso"
                  value={actividad.tipoPermiso || ""}
                  onChange={(e) => onActividadChange(index, e)}
                  className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-10 text-sm border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Seleccionar tipo de permiso...</option>
                  <option value="permiso remunerado">Permiso Remunerado</option>
                  <option value="permiso NO remunerado">Permiso NO Remunerado</option>
                </Input>
              </div>
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Hora Inicio *
              </label>
              <Input
                type="time"
                name="horaInicio"
                value={actividad.horaInicio || ""}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-11 text-sm border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                Hora Fin *
              </label>
              <Input
                type="time"
                name="horaFin"
                value={actividad.horaFin || ""}
                onChange={(e) => onActividadChange(index, e)}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-11 text-sm border-gray-300 rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-m font-medium text-gray-700">
                <Timer className="w-3 h-3 text-green-600" />
                Tiempo Calculado
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 bg-white border border-gray-300 rounded-lg font-mono text-sm shadow-sm">
                  {tiempoCalculado > 0 ? `${tiempoCalculado} min (${formatTiempo(tiempoCalculado)})` : '0 min'}
                </div>
                {cruzaMedianoche && (
                  <div className="flex items-center gap-1 text-amber-600 text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                    <Moon className="w-3 h-3" />
                    <span className="hidden sm:inline">Cruza medianoche</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Observaciones */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <h4 className="font-semibold text-gray-700 text-sm">
              Observaciones
              {actividad.tipoTiempo === 'Permiso Laboral' && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h4>
          </div>
          <Textarea
            name="observaciones"
            value={actividad.observaciones || ''}
            onChange={(e) => onActividadChange(index, e)}
            placeholder={
              actividad.tipoTiempo === 'Permiso Laboral' 
                ? "MOTIVO DEL PERMISO: (Campo obligatorio para permisos laborales)"
                : "Notas adicionales sobre la actividad..."
            }
            rows={3}
            className={`transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm border-gray-300 rounded-lg ${
              actividad.tipoTiempo === 'Permiso Laboral' 
                ? 'border-red-300 bg-red-50 placeholder-red-400' 
                : ''
            }`}
            required={actividad.tipoTiempo === 'Permiso Laboral'}
          />
        </div>
      </div>
    </Card>
  );
};

// Componente mejorado para plantillas rápidas editables
const PlantillasRapidas = ({ onAgregarPlantilla, areasProduccionData, maquinasData, insumosData, procesosData, disabled = false }) => {
  const [showPlantillas, setShowPlantillas] = useState(false);

  // Configurar las plantillas con los IDs correctos de la base de datos
  const configurarPlantilla = async (plantilla) => {
    // Buscar el área "Otros" o similar
    const areaOtros = areasProduccionData.find(area =>
      area.nombre.toLowerCase().includes('otros')
    );

    // Buscar máquina "No Aplica" o similar (usar campo "estado" = "activo")
    const maquinaNoAplica = maquinasData.find(maq =>
      (maq.estado === "activo" || !maq.hasOwnProperty('estado')) &&
      maq.nombre.toLowerCase().includes('no aplica')
    );

    // Buscar insumo "No aplica" (usar campo adecuado) - siempre se usa para todas las plantillas
    const insumoNoAplica = insumosData.find(insumo =>
      (insumo.estado === "activo" ||
        insumo.activo === true ||
        insumo.activo === "true" ||
        insumo.activo === 1 ||
        insumo.activo === "1" ||
        (!insumo.hasOwnProperty('estado') && !insumo.hasOwnProperty('activo'))) &&
      insumo.nombre.toLowerCase().includes('no aplica')
    );

    // Configurar insumos - siempre usar "No aplica" para todas las plantillas
    let insumosConfigured = [];
    if (insumoNoAplica) {
      insumosConfigured = [insumoNoAplica._id];
    }

    // Configurar maquina - siempre usar "No aplica" para todas las plantillas
    let maquinaConfigured = [];
    if (maquinaNoAplica) {
      maquinaConfigured = [maquinaNoAplica._id];
    }

    // Log para debug
    // console.log(`Configurando plantilla ${plantilla.nombre}:`, {
    //   area: areaOtros?.nombre || 'No encontrada',
    //   maquina: maquinaNoAplica?.nombre || 'No encontrada',
    //   insumo: insumoNoAplica?.nombre || 'No encontrado',
    //   procesoDefecto: plantilla.procesoDefecto
    // });

    return {
      ...plantilla.template,
      areaProduccion: areaOtros?._id || '',
      maquina: maquinaConfigured, // Configurar máquina automáticamente
      insumos: insumosConfigured, // Configurar insumos automáticamente
      availableProcesos: [],
      // Mantener las horas como sugerencia pero editables
      horaInicio: plantilla.horasSugeridas?.inicio || '',
      horaFin: plantilla.horasSugeridas?.fin || ''
    };
  };

  const handleAgregarPlantilla = async (plantilla) => {
    const actividadConfigurada = await configurarPlantilla(plantilla);

    // Buscar procesos específicos después de configurar la plantilla
    if (actividadConfigurada.areaProduccion) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/procesos?areaId=${actividadConfigurada.areaProduccion}`);
        if (response.ok) {
          const data = await response.json();
          let procesosDisponibles = Array.isArray(data) ? data : (data.procesos || []);

          // Filtrar solo procesos activos para configuración de plantillas
          procesosDisponibles = procesosDisponibles.filter(proceso => {
            // Verificar campo "estado" = "activo" o campo "activo" = true
            return proceso.estado === "activo" ||
              proceso.activo === true ||
              proceso.activo === "true" ||
              proceso.activo === 1 ||
              proceso.activo === "1" ||
              (!proceso.hasOwnProperty('estado') && !proceso.hasOwnProperty('activo'));
          });

          // Buscar proceso específico usando la nueva configuración de búsqueda
          let procesoSeleccionado = null;

          // console.log(`🔍 Buscando proceso para plantilla "${plantilla.nombre}":`, {
          //   procesoDefecto: plantilla.procesoDefecto,
          //   busquedaProceso: plantilla.busquedaProceso,
          //   procesosDisponibles: procesosDisponibles.map(p => p.nombre)
          // });

          // 1. Primero buscar por nombre exacto del proceso por defecto
          if (plantilla.procesoDefecto) {
            procesoSeleccionado = procesosDisponibles.find(p =>
              p.nombre.toLowerCase() === plantilla.procesoDefecto.toLowerCase()
            );
          }

          // 2. Si no se encuentra por nombre exacto, buscar por términos de búsqueda
          if (!procesoSeleccionado && plantilla.busquedaProceso && plantilla.busquedaProceso.length > 0) {
            procesoSeleccionado = procesosDisponibles.find(p => {
              const nombreProceso = p.nombre.toLowerCase();
              return plantilla.busquedaProceso.some(termino =>
                nombreProceso.includes(termino.toLowerCase())
              );
            });
          }

          // 3. Si aún no se encuentra, intentar búsqueda más amplia
          if (!procesoSeleccionado && plantilla.procesoDefecto) {
            const palabrasClaveDefecto = plantilla.procesoDefecto.toLowerCase().split(' ');
            procesoSeleccionado = procesosDisponibles.find(p => {
              const nombreProceso = p.nombre.toLowerCase();
              return palabrasClaveDefecto.some(palabra => nombreProceso.includes(palabra));
            });

          }

          // 4. Como último recurso, usar el primer proceso disponible
          if (!procesoSeleccionado && procesosDisponibles.length > 0) {
            procesoSeleccionado = procesosDisponibles[0];
            console.log(`⚠️ Usando proceso fallback (primer disponible): ${procesoSeleccionado.nombre}`);
          }

          // Si no hay procesos disponibles en absoluto
          if (!procesoSeleccionado) {
            console.log(`❌ No se encontró ningún proceso para la plantilla "${plantilla.nombre}"`);
          }

          // Configurar la actividad con el proceso encontrado
          actividadConfigurada.availableProcesos = procesosDisponibles;
          if (procesoSeleccionado) {
            actividadConfigurada.procesos = [procesoSeleccionado._id];
            // console.log(`🎯 Proceso asignado a plantilla: ${procesoSeleccionado.nombre} (ID: ${procesoSeleccionado._id})`);
          } else {
            // Si no hay procesos disponibles, dejar vacío y mostrar mensaje
            console.log('No hay procesos disponibles para el área seleccionada');
            actividadConfigurada.procesos = [];
          }
        }
      } catch (error) {
        console.log('No se pudieron cargar los procesos automáticamente:', error);
        actividadConfigurada.availableProcesos = [];
        actividadConfigurada.procesos = [];
      }
    }

    onAgregarPlantilla(actividadConfigurada, plantilla.nombre);
    setShowPlantillas(false);
  };

  return (
    <div className="relative z-0">
      {/* Botón principal compacto para mostrar plantillas */}
      <Button
        type="button"
        onClick={() => setShowPlantillas(!showPlantillas)}
        disabled={disabled}
        className="group flex items-center gap-3 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md text-white px-6 py-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-medium text-sm border border-blue-500/20"
      >
        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg shadow-inner">
          <Plus className="w-4 h-4" />
        </div>
        <span className="font-semibold">Explorar Plantillas</span>
        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${showPlantillas ? 'rotate-90 text-yellow-300' : 'group-hover:translate-x-1'}`} />
      </Button>

      {/* Panel desplegable usando Portal para máximo z-index */}
      {showPlantillas && ReactDOM.createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{
            zIndex: 999999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={() => setShowPlantillas(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-full max-w-md max-h-[85vh] overflow-y-auto relative"
            style={{ zIndex: 1000000 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header compacto */}
            <div className="mb-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="p-1.5 bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-500 rounded-lg shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Biblioteca de Plantillas</h3>
                  <p className="text-xs text-gray-600">Selecciona una plantilla optimizada</p>
                </div>
              </div>
            </div>

            {/* Lista de plantillas compacta con altura ajustada */}
            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 mb-4">
              {PLANTILLAS_ACTIVIDADES.map((plantilla, index) => (
                <div
                  key={plantilla.id}
                  className="group relative bg-gradient-to-r from-gray-50/80 via-white to-blue-50/30 hover:from-blue-50 hover:via-indigo-50 hover:to-purple-50 border border-gray-200/60 hover:border-blue-300/60 rounded-lg p-3 cursor-pointer transition-all duration-300 hover:shadow-md transform hover:scale-[1.01] active:scale-[0.99] backdrop-blur-sm"
                  onClick={() => handleAgregarPlantilla(plantilla)}
                >
                  {/* Número de plantilla muy compacto */}
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-gradient-to-br from-gray-200 to-gray-300 group-hover:from-blue-200 group-hover:to-indigo-300 rounded flex items-center justify-center text-xs font-bold text-gray-600 group-hover:text-blue-800 transition-all duration-300">
                    {index + 1}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-lg transform group-hover:scale-110 transition-all duration-300">
                      {plantilla.icono}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-800 mb-1 group-hover:text-blue-800 transition-colors duration-300 truncate">
                        {plantilla.nombre}
                      </div>
                      <div className="text-xs text-gray-600 mb-2 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
                        {plantilla.descripcion}
                      </div>

                      {/* Información de horas muy compacta */}
                      {plantilla.horasSugeridas && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-white/80 group-hover:bg-blue-50/80 px-2 py-1 rounded border border-gray-200/60 group-hover:border-blue-200/60 transition-all duration-300">
                          <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <span className="font-medium text-xs">{plantilla.horasSugeridas.inicio} - {plantilla.horasSugeridas.fin}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-500 transition-all duration-300 transform group-hover:scale-105 flex-shrink-0">
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Botón para cerrar más visible */}
            <div className="pt-3 border-t border-gray-200/60 flex justify-center">
              <button
                type="button"
                onClick={() => setShowPlantillas(false)}
                className="group flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 px-4 py-2.5 rounded-lg transition-all duration-300 border border-transparent hover:border-gray-200 font-medium"
              >
                <span>Cerrar Panel</span>
                <div className="transform group-hover:rotate-90 transition-transform duration-300">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Componente principal mejorado
export default function RegistroProduccion() {
  const { jornadaId: urlJornadaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [nombreOperario, setNombreOperario] = useState("");
  const [currentStep, setCurrentStep] = useState(1); // Para wizard steps
  const [showFloatingButton, setShowFloatingButton] = useState(false);
  const [triggerValidation, setTriggerValidation] = useState(false);
  const [actividadesWithErrors, setActividadesWithErrors] = useState(new Set());
  const [esDuplicacion, setEsDuplicacion] = useState(false);
  const [datosJornadaOriginal, setDatosJornadaOriginal] = useState(null);
  const [formError, setFormError] = useState(null); // Para mostrar errores prominentes en la UI

  const [jornadaData, setJornadaData] = useState({
    fecha: (() => {
      const hoy = new Date();
      return `${hoy.getFullYear()}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getDate().toString().padStart(2, '0')}`;
    })(),
    horaInicio: "",
    horaFin: "",
    operario: ""
  });

  const [actividades, setActividades] = useState([
    {
      oti: "",
      procesos: [],
      areaProduccion: "",
      maquina: [],
      insumos: [],
      tipoTiempo: "",
      tipoPermiso: "",
      horaInicio: "",
      horaFin: "",
      tiempo: 0,
      observaciones: "",
      availableProcesos: []
    }
  ]);

  const [actividadesExistentes, setActividadesExistentes] = useState([]);
  const [maquinasData, setMaquinasData] = useState([]);
  const [areasProduccionData, setAreasProduccionData] = useState([]);
  const [insumosData, setInsumosData] = useState([]);
  const [actividadesResumen, setActividadesResumen] = useState([]);
  const [loadingResumen, setLoadingResumen] = useState(false);
  // Inicialización y carga de datos
  useEffect(() => {
    const loadInitialData = async () => {
      const operario = localStorage.getItem("operario");
      if (!operario) {
        toast.error("No tienes acceso. Valida cédula.");
        navigate("/validate-cedula");
        return;
      }

      try {
        const operarioData = JSON.parse(operario);
        if (operarioData?.name) setNombreOperario(operarioData.name);
        if (operarioData?._id || operarioData?.id) {
          setJornadaData(prev => ({ ...prev, operario: operarioData._id || operarioData.id }));
        }
      } catch (error) {
        toast.error("No se pudo leer la información del operario. Por favor, vuelve a validar tu cédula.");
      }

      // Cargar datos de selectores - Solo máquinas, insumos y procesos activos
      try {
        const maquinasRes = await fetch(`${API_BASE_URL}/api/produccion/maquinas`);
        if (maquinasRes.ok) {
          const maquinasDataRaw = await maquinasRes.json();
          // Filtrar máquinas activas (usar campo "estado" = "activo")
          const maquinasActivas = maquinasDataRaw.filter(maquina => {
            return maquina.estado === "activo" || !maquina.hasOwnProperty('estado');
          });

          setMaquinasData(maquinasActivas);
        } else {
          toast.error("No se pudieron cargar las máquinas. Intenta de nuevo más tarde.");
        }

        const areasRes = await fetch(`${API_BASE_URL}/api/produccion/areas`);
        if (areasRes.ok) {
          // Las áreas no tienen estado activo/inactivo, se cargan todas
          const areasData = await areasRes.json();
          setAreasProduccionData(areasData);
        }

        const insumosRes = await fetch(`${API_BASE_URL}/api/produccion/insumos`);
        if (insumosRes.ok) {
          const insumosDataRaw = await insumosRes.json();
          // Filtrar insumos activos 
          const insumosActivos = insumosDataRaw.filter(insumo => {
            return insumo.estado === "activo" ||
              insumo.activo === true ||
              insumo.activo === "true" ||
              insumo.activo === 1 ||
              insumo.activo === "1" ||
              (!insumo.hasOwnProperty('estado') && !insumo.hasOwnProperty('activo'));
          });

          setInsumosData(insumosActivos);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }

      // 🔄 LÓGICA DE DUPLICACIÓN: Verificar si hay datos de jornada duplicada
      const searchParams = new URLSearchParams(location.search);
      const esDuplicacion = searchParams.get('duplicar') === 'true';
      const jornadaDuplicada = localStorage.getItem('jornadaDuplicada');

      if (jornadaDuplicada && !urlJornadaId && esDuplicacion) {
        try {
          const datosDuplicacion = JSON.parse(jornadaDuplicada);

          // Establecer estados de duplicación
          setEsDuplicacion(true);
          setDatosJornadaOriginal({
            fechaOriginal: datosDuplicacion.fechaOriginal,
            jornadaOriginalId: datosDuplicacion.jornadaOriginalId
          });

          // Establecer la fecha de duplicación
          if (datosDuplicacion.fechaDuplicacion) {
            setJornadaData(prev => ({ ...prev, fecha: datosDuplicacion.fechaDuplicacion }));
          }

          // Cargar las actividades duplicadas
          if (datosDuplicacion.actividadesDuplicadas && Array.isArray(datosDuplicacion.actividadesDuplicadas)) {
            const actividadesDuplicadas = datosDuplicacion.actividadesDuplicadas;

            // console.log('🔄 Cargando actividades duplicadas:', actividadesDuplicadas.length);

            setActividades(actividadesDuplicadas);

            // 🎯 Los procesos ya vienen precargados desde DuplicarJornada, 
            // pero reforzamos la carga por si acaso
            setTimeout(() => {
              actividadesDuplicadas.forEach((act, index) => {
                if (act.areaProduccion && (!act.availableProcesos || act.availableProcesos.length === 0)) {
                  console.log(`🔄 Recargando procesos para actividad ${index + 1}, área: ${act.areaProduccion}`);
                  fetchProcesosForActivity(index, act.areaProduccion);
                } else if (act.availableProcesos && act.availableProcesos.length > 0) {
                }
              });
            }, 200);

            // Mostrar mensaje de confirmación
            toast.success(`✨ Jornada del ${new Date(datosDuplicacion.fechaOriginal).toLocaleDateString()} duplicada exitosamente! Puedes editar todos los campos.`, {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
            });
          }

          // Limpiar datos de duplicación del localStorage
          localStorage.removeItem('jornadaDuplicada');

        } catch (error) {
          console.error('Error al procesar jornada duplicada:', error);
          toast.error('Error al cargar la jornada duplicada. Se cargará una jornada nueva.');
          localStorage.removeItem('jornadaDuplicada');
        }
      }

      // Lógica principal para obtener o crear la jornada
      if (urlJornadaId) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/jornadas/${urlJornadaId}`);
          if (res.ok) {
            const jornada = await res.json();

            // Normalizar actividades existentes
            if (Array.isArray(jornada.registros)) {
              const actividadesNorm = jornada.registros.map(act => ({
                ...act,
                horaInicio: act.horaInicio
                  ? new Date(act.horaInicio).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                  : "",
                horaFin: act.horaFin
                  ? new Date(act.horaFin).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })
                  : "",
                tiempo: act.tiempo || 0,
                availableProcesos: Array.isArray(act.procesosInfo) ? act.procesosInfo : [],
              }));
              setActividadesExistentes(actividadesNorm);
              setActividades(actividadesNorm.length > 0 ? actividadesNorm : [actividades[0]]);

              // Cargar procesos para cada actividad existente
              actividadesNorm.forEach((act, index) => {
                if (act.areaProduccion) {
                  fetchProcesosForActivity(index, act.areaProduccion);
                }
              });
            }

            // Establecer fecha de la jornada
            if (jornada.fecha) {
              let fechaStr = jornada.fecha;
              if (typeof fechaStr === "string" && fechaStr.length > 10) {
                fechaStr = fechaStr.substring(0, 10);
              }
              setJornadaData(prev => ({ ...prev, fecha: fechaStr }));
            }
          }
        } catch (error) {
          toast.error("No se pudieron cargar las actividades de la jornada. Intenta de nuevo más tarde.");
        }
      }
    };

    loadInitialData();
  }, [navigate, urlJornadaId, location]);

  // Cargar resumen de actividades
  useEffect(() => {
    const fetchActividadesResumen = async () => {
      if (jornadaData.fecha && jornadaData.operario && !urlJornadaId) {
        setLoadingResumen(true);
        try {
          const response = await fetch(`${API_BASE_URL}/api/jornadas/operario/${jornadaData.operario}?fecha=${jornadaData.fecha}`);
          if (!response.ok) {
            if (response.status === 404) {
              setActividadesResumen([]);
            } else {
              toast.error("Error al cargar resumen de actividades.");
              setActividadesResumen([]);
            }
          } else {
            const jornadasDelDiaFetched = await response.json();

            if (jornadasDelDiaFetched && jornadasDelDiaFetched.length > 0) {
              const selectedDateStr = jornadaData.fecha;

              let todasLasActividadesDelDia = jornadasDelDiaFetched
                .filter(jornada => {
                  if (!jornada.fecha) return false;
                  const backendJornadaDateStr = jornada.fecha.split('T')[0];
                  return backendJornadaDateStr === selectedDateStr;
                })
                .reduce((acc, jornada) => {
                  const actividadesDeJornada = jornada.registros || [];
                  return acc.concat(actividadesDeJornada.map(act => ({
                    ...act,
                    fechaJornada: jornada.fecha,
                    otiNumero: act.oti?.numeroOti || "N/A",
                    procesosNombres: Array.isArray(act.procesos) ? act.procesos.map(p => p.nombre).join(', ') : "N/A"
                  })));
                }, []);

              todasLasActividadesDelDia.sort((a, b) => {
                const dateA = a.horaInicio ? new Date(a.horaInicio) : null;
                const dateB = b.horaInicio ? new Date(b.horaInicio) : null;

                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
                if (isNaN(dateA.getTime())) return 1;
                if (isNaN(dateB.getTime())) return -1;

                return dateA.getTime() - dateB.getTime();
              });

              setActividadesResumen(todasLasActividadesDelDia);
            } else {
              setActividadesResumen([]);
            }
          }
        } catch (error) {
          toast.error("No se pudo cargar el resumen de actividades.");
          setActividadesResumen([]);
        } finally {
          setLoadingResumen(false);
        }
      } else {
        setActividadesResumen([]);
      }
    };

    fetchActividadesResumen();
  }, [jornadaData.fecha, jornadaData.operario, urlJornadaId]);

  // Calcular horaInicio y horaFin de la jornada
  useEffect(() => {
    const todas = [...actividadesExistentes, ...actividades];
    const horasInicio = todas.map(a => a.horaInicio).filter(Boolean);
    const horasFin = todas.map(a => a.horaFin).filter(Boolean);
    let primeraHora = "";
    let ultimaHora = "";

    const parseTime = (timeStr) => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    if (horasInicio.length > 0) {
      primeraHora = horasInicio.sort((a, b) => parseTime(a) - parseTime(b))[0];
    }

    if (horasFin.length > 0) {
      ultimaHora = horasFin.sort((a, b) => parseTime(a) - parseTime(b))[horasFin.length - 1];
    }

    setJornadaData(prev => ({
      ...prev,
      horaInicio: primeraHora,
      horaFin: ultimaHora
    }));
  }, [actividades, actividadesExistentes]);

  // Control de visibilidad del botón flotante basado solo en scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const shouldShow = scrollTop > 300;
      setShowFloatingButton(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);

    // Mostrar el botón inicialmente después de un pequeño delay
    const timer = setTimeout(() => {
      setShowFloatingButton(true);
    }, 1000);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  const parseLocalDate = (dateString) => {
    if (!dateString || typeof dateString !== 'string') return null;
    const datePart = dateString.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return new Date(year, month - 1, day);
      }
    }
    return null;
  };

  const fetchProcesosForActivity = useCallback(async (activityIndex, areaId) => {
    if (!areaId) {
      setActividades(prev =>
        prev.map((act, idx) =>
          idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
        )
      );
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/procesos?areaId=${areaId}`);
      if (response.ok) {
        const data = await response.json();

        let determinedProcesos = [];
        if (Array.isArray(data)) {
          determinedProcesos = data;
        } else if (data && Array.isArray(data.procesos)) {
          determinedProcesos = data.procesos;
        } else {
          determinedProcesos = [];
        }

        // Filtrar solo procesos activos para el registro de producción
        const procesosActivos = determinedProcesos.filter(proceso => {
          // Verificar campo "estado" = "activo" o campo "activo" = true
          return proceso.estado === "activo" ||
            proceso.activo === true ||
            proceso.activo === "true" ||
            proceso.activo === 1 ||
            proceso.activo === "1" ||
            (!proceso.hasOwnProperty('estado') && !proceso.hasOwnProperty('activo'));
        });;

        setActividades(prev =>
          prev.map((act, idx) => {
            if (idx === activityIndex) {
              return { ...act, availableProcesos: procesosActivos, procesos: [] };
            }
            return act;
          })
        );
      } else {
        toast.error("Error al cargar procesos para el área seleccionada.");
        setActividades(prev =>
          prev.map((act, idx) =>
            idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
          )
        );
      }
    } catch (error) {
      toast.error("No se pudieron cargar los procesos. Intenta de nuevo más tarde.");
      setActividades(prev =>
        prev.map((act, idx) =>
          idx === activityIndex ? { ...act, availableProcesos: [], procesos: [] } : act
        )
      );
    }
  }, []);

  const handleActividadChange = (index, e_or_selectedOptions, actionMeta) => {
    let name, value;

    if (actionMeta && actionMeta.name) {
      name = actionMeta.name;
      value = e_or_selectedOptions ? e_or_selectedOptions.map(option => option.value) : [];
    } else {
      name = e_or_selectedOptions.target.name;
      value = e_or_selectedOptions.target.value;
    }

    const nuevasActividades = actividades.map((act, idx) => {
      if (idx === index) {
        let updatedAct = { ...act };

        if (name === 'areaProduccion') {
          updatedAct.areaProduccion = value;
          updatedAct.procesos = [];
          updatedAct.availableProcesos = [];
          fetchProcesosForActivity(index, value);
        } else if (name === 'procesos') {
          updatedAct.procesos = value;
        } else if (name === 'insumos') {
          updatedAct.insumos = value;
        } else if (name === 'maquina') {
          updatedAct.maquina = value;
        } else if (name === 'horaInicio' || name === 'horaFin') {
          updatedAct[name] = value;
          // Calcular tiempos de inicio y fin
          const inicio = updatedAct.horaInicio;
          const fin = updatedAct.horaFin;
          if (inicio && fin) {
            const inicioDate = new Date(`1970-01-01T${inicio}:00`);
            let finDate = new Date(`1970-01-01T${fin}:00`);

            // Manejar cruce de medianoche: si fin <= inicio, asumir que fin es del día siguiente
            if (finDate <= inicioDate) {
              finDate = new Date(`1970-01-02T${fin}:00`);
            }

            if (finDate > inicioDate) {
              updatedAct.tiempo = Math.floor((finDate - inicioDate) / 60000);
            } else {
              updatedAct.tiempo = 0;
            }
          } else {
            updatedAct.tiempo = 0;
          }
        } else if (name === 'tipoTiempo') {
          updatedAct[name] = value;
          // Limpiar tipoPermiso si no es "Permiso Laboral"
          if (value !== 'Permiso Laboral') {
            updatedAct.tipoPermiso = '';
          }
        } else {
          updatedAct[name] = value;
        }
        return updatedAct;
      }
      return act;
    });
    setActividades(nuevasActividades);
  };

  const combinarFechaYHora = (fecha, hora) => {
    if (!hora || typeof hora !== 'string' || !hora.match(/^\d{2}:\d{2}$/)) return null;

    const [hh, mm] = hora.split(":");
    const [yyyy, mmFecha, dd] = fecha.split('-');

    const date = new Date(Number(yyyy), Number(mmFecha) - 1, Number(dd), Number(hh), Number(mm), 0);

    // Mantener en timezone local en lugar de convertir a UTC
    return isNaN(date.getTime()) ? null : date;
  };

  const addActividad = (plantilla = null, nombrePlantilla = null) => {
    const nuevaActividad = plantilla || {
      oti: "",
      procesos: [],
      areaProduccion: "",
      maquina: [],
      insumos: [],
      tipoTiempo: "",
      tipoPermiso: "",
      horaInicio: "",
      horaFin: "",
      tiempo: 0,
      observaciones: "",
      availableProcesos: []
    };

    // Log para debug
    // if (plantilla) {
    //   console.log(`📝 Agregando plantilla "${nombrePlantilla}":`, {
    //     procesos: nuevaActividad.procesos,
    //     availableProcesos: nuevaActividad.availableProcesos?.length || 0,
    //     areaProduccion: nuevaActividad.areaProduccion
    //   });
    //}

    // Si es una plantilla y solo hay una actividad que está vacía, completarla en lugar de agregar nueva
    if (plantilla && actividades.length === 1) {
      const primeraActividad = actividades[0];
      const estaVacia = !primeraActividad.oti &&
        !primeraActividad.areaProduccion &&
        (!primeraActividad.maquina || primeraActividad.maquina.length === 0) &&
        (!primeraActividad.procesos || primeraActividad.procesos.length === 0) &&
        (!primeraActividad.insumos || primeraActividad.insumos.length === 0) &&
        !primeraActividad.tipoTiempo &&
        !primeraActividad.horaInicio &&
        !primeraActividad.horaFin;

      if (estaVacia) {
        // Completar la primera actividad con los datos de la plantilla
        setActividades([nuevaActividad]);

        // Mostrar mensaje específico para reemplazo
        toast.success(`✨ ${nombrePlantilla} aplicada! Primera actividad completada.`, {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });

        // Scroll hacia la primera actividad
        setTimeout(() => {
          const firstElement = document.querySelector('[class*="ActividadCard"]');
          if (firstElement) {
            firstElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 100);

        return;
      }
    }

    // Comportamiento normal: agregar nueva actividad
    setActividades(prev => [...prev, nuevaActividad]);

    // Solo cargar procesos automáticamente si NO es una plantilla
    // (las plantillas ya vienen con procesos preconfigurados)
    if (!plantilla) {
      // Es una actividad normal, no una plantilla
      const newIndex = actividades.length;
      if (nuevaActividad.areaProduccion) {
        setTimeout(() => {
          fetchProcesosForActivity(newIndex, nuevaActividad.areaProduccion);
        }, 100);
      }
    }

    // Mostrar mensaje de confirmación con toast
    const mensaje = nombrePlantilla
      ? `✨ ${nombrePlantilla} agregada! Puedes editar las horas y otros campos.`
      : `✨ Nueva actividad agregada! Total: ${actividades.length + 1}`;

    toast.success(mensaje, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Scroll suave hacia la nueva actividad después de un pequeño delay
    setTimeout(() => {
      const elements = document.querySelectorAll('[class*="ActividadCard"]');
      const lastElement = elements[elements.length - 1];
      if (lastElement) {
        lastElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Manejar cambios de validación desde los componentes ActividadCard
  const handleValidationChange = (activityIndex, hasErrors) => {
    setActividadesWithErrors(prev => {
      const newSet = new Set(prev);
      if (hasErrors) {
        newSet.add(activityIndex);
      } else {
        newSet.delete(activityIndex);
      }
      return newSet;
    });
  };

  const removeActividad = (index) => {
    if (actividades.length > 1) {
      setActividades(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.warn("Debe haber al menos una actividad.");
    }
  };

  // Función para duplicar una actividad
  const duplicateActividad = (index) => {
    const actividadOriginal = actividades[index];

    // Crear una copia profunda de la actividad
    const actividadDuplicada = {
      ...actividadOriginal,
      // Mantener todos los datos pero como una nueva instancia
      oti: actividadOriginal.oti,
      procesos: [...(actividadOriginal.procesos || [])],
      areaProduccion: actividadOriginal.areaProduccion,
      maquina: [...(actividadOriginal.maquina || [])],
      insumos: [...(actividadOriginal.insumos || [])],
      tipoTiempo: actividadOriginal.tipoTiempo,
      tipoPermiso: actividadOriginal.tipoPermiso,
      horaInicio: actividadOriginal.horaInicio,
      horaFin: actividadOriginal.horaFin,
      tiempo: actividadOriginal.tiempo,
      observaciones: actividadOriginal.observaciones,
      availableProcesos: [...(actividadOriginal.availableProcesos || [])]
    };

    // Agregar la actividad duplicada después de la original
    const nuevasActividades = [
      ...actividades.slice(0, index + 1),
      actividadDuplicada,
      ...actividades.slice(index + 1)
    ];

    setActividades(nuevasActividades);

    // Mostrar mensaje de confirmación
    toast.success(`🔄 Actividad N° ${index + 1} duplicada exitosamente! Nueva actividad creada.`, {
      position: "bottom-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });

    // Scroll hacia la nueva actividad duplicada
    setTimeout(() => {
      const elements = document.querySelectorAll('[class*="border-l-blue-500"]');
      const targetElement = elements[index + 1]; // La actividad duplicada estará en la posición index + 1
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }
    }, 100);
  };

  const handleSubmitJornada = async (e) => {
    e.preventDefault();
    setCurrentStep(3);
    
    // Limpiar error previo al intentar guardar de nuevo
    setFormError(null);

    // Disparar validación visual en todos los componentes
    setTriggerValidation(prev => !prev);

    // Validaciones
    if (!actividades || actividades.length === 0) {
      toast.error("Debe agregar al menos una actividad para guardar la jornada.");
      return;
    }

    // Esperar un poco para que se actualice la validación visual
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let i = 0; i < actividades.length; i++) {
      const actividad = actividades[i];
      const camposFaltantes = [];

      if (!actividad.oti) camposFaltantes.push('OTI');
      if (!actividad.areaProduccion) camposFaltantes.push('Área de Producción');
      if (!actividad.maquina || actividad.maquina.length === 0) camposFaltantes.push('Maquina(s)');
      if (!actividad.procesos || actividad.procesos.length === 0) camposFaltantes.push('Proceso(s)');
      if (!actividad.insumos || actividad.insumos.length === 0) camposFaltantes.push('Insumo(s)');
      if (!actividad.tipoTiempo) camposFaltantes.push('Tipo de Tiempo');
      if (actividad.tipoTiempo === 'Permiso Laboral' && !actividad.tipoPermiso) {
        camposFaltantes.push('Tipo de Permiso');
      }
      // Validación condicional para observaciones: obligatorias solo para "Permiso Laboral"
      if (actividad.tipoTiempo === 'Permiso Laboral' && (!actividad.observaciones || actividad.observaciones.trim() === '')) {
        camposFaltantes.push('Observaciones (requeridas para permisos laborales)');
      }
      if (!actividad.horaInicio) camposFaltantes.push('Hora de Inicio');
      if (!actividad.horaFin) camposFaltantes.push('Hora de Fin');

      if (camposFaltantes.length > 0) {
        toast.error(`Actividad ${i + 1}: Faltan los siguientes campos: ${camposFaltantes.join(', ')}`);
        return;
      }
    }

    if (!jornadaData.horaInicio || !jornadaData.horaFin) {
      toast.error("Horas de inicio o fin de jornada vacías.");
      return;
    }

    setLoading(true);

    const dataToSend = {
      ...jornadaData,
      fecha: jornadaData.fecha,
      horaInicio: combinarFechaYHora(jornadaData.fecha, jornadaData.horaInicio),
      horaFin: combinarFechaYHora(jornadaData.fecha, jornadaData.horaFin),
      actividades: actividades.map(actividad => ({
        oti: actividad.oti,
        areaProduccion: actividad.areaProduccion,
        maquina: actividad.maquina || [],
        procesos: actividad.procesos || [],
        insumos: actividad.insumos || [],
        tipoTiempo: actividad.tipoTiempo,
        tipoPermiso: actividad.tipoPermiso || null,
        horaInicio: actividad.horaInicio && actividad.horaInicio !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaInicio) : null,
        horaFin: actividad.horaFin && actividad.horaFin !== "" ? combinarFechaYHora(jornadaData.fecha, actividad.horaFin) : null,
        tiempo: actividad.tiempo || 0,
        observaciones: actividad.observaciones || null
      }))
    };

    try {
      const endpoint = urlJornadaId ? `${API_BASE_URL}/api/jornadas/${urlJornadaId}`
        : `${API_BASE_URL}/api/jornadas/completa`;
      const method = urlJornadaId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error del backend:', result);
        
        // Manejo específico de errores conocidos
        let errorMessage = "Error inesperado";
        
        if (result.error || result.msg) {
          const errorText = result.error || result.msg;
          
          // Verificar si es el error específico de horario laboral duplicado
          if (errorText.includes('Ya existe un registro con el proceso "Horario Laboral"') || 
              errorText.includes('Ya existe un registro de Horario Laboral')) {
            errorMessage = "❌ No se puede guardar: Ya registraste un proceso 'Horario Laboral' para esta fecha. Solo se permite un proceso de horario laboral por día.";
          } else if (errorText.includes('HORARIO_DUPLICADO') || result.code === 'HORARIO_DUPLICADO') {
            errorMessage = "❌ No se puede guardar: Ya existe un proceso de horario laboral registrado para esta fecha.";
          } else if (errorText.includes('Hubo un error al guardar la jornada completa')) {
            // Mostrar detalles adicionales si están disponibles
            const details = result.details ? ` Detalles: ${result.details}` : '';
            errorMessage = `❌ Error al procesar la jornada.${details}`;
          } else if (errorText.includes('validation failed')) {
            errorMessage = `❌ Error de validación: ${errorText}`;
          } else {
            errorMessage = `❌ Error al guardar: ${errorText}`;
          }
        }
        
        // Mostrar error tanto en toast como en el formulario
        setFormError(errorMessage);
        toast.error(errorMessage, {
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        setLoading(false);
        return;
      } 
      
      // Limpiar cualquier error previo
      setFormError(null);
      
      toast.success("✅ Jornada guardada exitosamente", {
        autoClose: 4000,
      });
      navigate("/historial-jornadas");
    } catch (error) {
      console.error('Error en la petición:', error);
      
      // Manejo específico de errores de conexión
      let connectionErrorMessage;
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        connectionErrorMessage = "❌ Error de conexión: No se pudo conectar con el servidor. Verifica tu conexión a internet.";
        toast.error(connectionErrorMessage, {
          autoClose: 6000,
        });
      } else {
        connectionErrorMessage = "❌ Error inesperado: No se pudo guardar la jornada. Intenta de nuevo más tarde.";
        toast.error(connectionErrorMessage, {
          autoClose: 5000,
        });
      }
      
      // Mostrar también en el formulario
      setFormError(connectionErrorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex bg-gray-100 min-h-screen h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="container mx-auto py-8 max-w-7xl space-y-4 pb-24">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
              Registro de Tiempos de Producción
            </h1>
          </div>

          {/* Banner de duplicación */}
          {esDuplicacion && datosJornadaOriginal && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border border-green-200 rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Copy className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-green-800">
                    🎯 Duplicando Jornada
                  </h3>
                  <p className="text-sm text-green-700">
                    Se han cargado las actividades de la jornada del{' '}
                    <span className="font-semibold">
                      {new Date(datosJornadaOriginal.fechaOriginal).toLocaleDateString()}
                    </span>
                    . Puedes editar cualquier campo antes de guardar.
                  </p>
                </div>
                <div className="text-green-600">
                  <CheckCircle className="w-8 h-8" />
                </div>
              </div>
              <div className="mt-3 p-3 bg-white/60 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-medium">
                  💡 <strong>Tip:</strong> Revisa especialmente las horas de inicio y fin para ajustarlas a tu nueva jornada.
                </p>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmitJornada} className="space-y-4">            {/* Información de la jornada */}
            <Card className="p-3 shadow-lg bg-white border border-gray-200 rounded-xl">
              {/* Información adicional para duplicación */}
              {esDuplicacion && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Campos editables:</span>
                  </div>
                  <ul className="text-xs text-blue-700 space-y-1 ml-6">
                    <li>• <strong>Fecha:</strong> Ya está configurada, pero puedes cambiarla</li>
                    <li>• <strong>Horarios:</strong> Ajusta las horas de inicio y fin según tu nueva jornada</li>
                    <li>• <strong>OTIs:</strong> Modifica los números de orden si es necesario</li>
                    <li>• <strong>Observaciones:</strong> Actualiza cualquier comentario específico</li>
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-m font-semibold text-gray-700">Operario Asignado</label>
                  <Input
                    type="text"
                    value={nombreOperario || "Cargando..."}
                    disabled
                    className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-300 h-11 text-m rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-m font-semibold text-gray-700">
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    Fecha de la Jornada *
                  </label>
                  <Input
                    type="date"
                    name="fecha"
                    value={jornadaData.fecha}
                    onChange={(e) => {
                      setJornadaData(prev => ({ ...prev, fecha: e.target.value }));
                      setCurrentStep(2); // Move to step 2 when date is selected
                    }}
                    required
                    className="transition-all duration-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 h-11 text-m border-gray-300 rounded-lg"
                  />
                </div>
              </div>
            </Card>{/* Resumen de actividades existentes con diseño de tabla */}
            {!urlJornadaId && actividadesResumen.length > 0 && (
              <div className="bg-gradient-to-r from-gray-600 to-gray-800 border border-gray-200 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-500 p-2 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        Actividades Registradas
                      </h3>
                      <p className="text-white text-sm">
                        {actividadesResumen.length} actividad{actividadesResumen.length !== 1 ? 'es' : ''} ya registradas para esta fecha
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white mt-1">
                      {parseLocalDate(jornadaData.fecha)?.toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                {/* Tabla de actividades existentes */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              Proceso
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            # OTI
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Hora Inicio
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Hora Fin
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                            <div className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                              Duración
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {actividadesResumen.map((act, index) => {                            // Calcular duración
                          const calcularDuracion = (horaInicio, horaFin) => {
                            if (!horaInicio || !horaFin) return 'N/A';

                            const inicio = new Date(horaInicio);
                            let fin = new Date(horaFin);

                            // Si la hora de fin es menor que la de inicio, significa que cruza medianoche
                            if (fin < inicio) {
                              // Agregar un día a la fecha de fin
                              fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
                            }

                            const diffMs = fin - inicio;
                            const diffMinutos = Math.floor(diffMs / (1000 * 60));
                            const horas = Math.floor(diffMinutos / 60);
                            const minutos = diffMinutos % 60;

                            return `${horas}h ${minutos}m`;
                          };

                          return (
                            <tr
                              key={act._id}
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                  <span className="text-sm font-semibold text-gray-800">
                                    {act.procesosNombres || 'N/A'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded">
                                  {act.otiNumero || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-900 font-mono">
                                  {act.horaInicio ? new Date(act.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-900 font-mono">
                                  {act.horaFin ? new Date(act.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {calcularDuracion(act.horaInicio, act.horaFin)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>)}
            {/* Plantillas Rápidas - Diseño Compacto */}
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-xl shadow-lg border border-blue-100/50 p-4 relative backdrop-blur-sm">
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">Plantillas Rápidas</h2>
                      <p className="text-sm text-gray-600">Configuraciones predefinidas optimizadas</p>
                    </div>
                  </div>

                  {/* Componente de plantillas rápidas integrado */}
                  <PlantillasRapidas
                    onAgregarPlantilla={addActividad}
                    areasProduccionData={areasProduccionData}
                    maquinasData={maquinasData}
                    insumosData={insumosData}
                    disabled={loading}
                  />
                </div>

                {/* Información adicional compacta */}
                <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border border-emerald-200/40 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-esmerald-800">Sistema de Plantillas Inteligentes</h4>
                      <p className="text-xs text-gray-600 leading-tight">
                        Cada plantilla incluye configuraciones optimizadas y completamente personalizables.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>              {/* Actividades */}
            <div className="space-y-4">
              {actividades.map((actividad, index) => (
                <ActividadCard
                  key={index}
                  actividad={actividad}
                  index={index}
                  onActividadChange={handleActividadChange}
                  onRemove={removeActividad}
                  onDuplicate={duplicateActividad}
                  areasProduccionData={areasProduccionData}
                  maquinasData={maquinasData}
                  insumosData={insumosData}
                  canRemove={actividades.length > 1}
                  triggerValidation={triggerValidation}
                  onValidationChange={handleValidationChange}
                />
              ))}
            </div>
            {/* Botones de acción */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-gradient-to-br from-teal-400 to-teal-600 rounded-lg">
                  <Save className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Guardar Jornada</h2>
                  <p className="text-sm text-gray-600">Guarda todas las actividades registradas en esta jornada</p>
                </div>
              </div>
              
              {/* Mostrar error prominente en la UI */}
              {formError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-red-800 mb-1">Error al guardar la jornada</h3>
                      <p className="text-sm text-red-700">{formError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormError(null)}
                      className="flex-shrink-0 ml-2 text-red-400 hover:text-red-500 transition-colors"
                    >
                      <span className="sr-only">Cerrar</span>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-center items-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className="group flex items-center gap-3 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md text-white px-6 py-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-medium text-sm border border-blue-500/20"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando Jornada...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Guardar
                    </>
                  )}
                </Button>
              </div>
            </div>            </form>
        </div>
      </div>
      {/* Botón Flotante para Agregar Actividad */}
      <div
        className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${
          showFloatingButton
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
        }`}
      >
        <div className="relative">
          {/* Botón principal */}
          <button
            type="button"
            onClick={addActividad}
            className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-110 active:scale-95 border-2 border-blue-700 hover:border-indigo-700"
            aria-label="Agregar nueva actividad"
          >
            {/* Efecto de pulso de fondo */}
            <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-20"></div>

            {/* Icono principal con animación */}
            <div className="relative flex items-center justify-center">
              <Plus className="w-6 h-6 transition-transform duration-300 group-hover:rotate-180" />
            </div>

            {/* Tooltip mejorado */}
            <div className="absolute bottom-full right-0 mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform group-hover:translate-y-0 translate-y-2">
              <div className="bg-gray-900 text-white text-sm px-4 py-3 rounded-xl whitespace-nowrap shadow-2xl border border-gray-700">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">Nueva Actividad</span>
                </div>
                <div className="text-xs text-gray-300 mt-1">
                  Click para agregar
                </div>
                {/* Flecha del tooltip */}
                <div className="absolute top-full right-6 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </button>
          {/* Contador de actividades con animación */}
          {actividades.length > 0 && (
            <button
              onClick={scrollToTop}
              className="absolute -top-2 -left-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs rounded-full h-7 w-7 flex items-center justify-center font-bold shadow-lg border-2 border-white animate-bounce hover:animate-none transition-all duration-200 hover:scale-110"
              title="Ir al inicio"
            >
              {actividades.length}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
