import { Users, Coffee, Utensils, Clock, FileCheck } from 'lucide-react';

// Plantillas de actividades predefinidas editables
export const plantillaActividades = [
      {
    id: 'control-horario',
    nombre: 'Horario Laboral',
    descripcion: 'Control de acceso y tiempo de trabajo del personal.',
    color: 'from-slate-500 to-slate-600',
    icono: <Clock className="w-4 h-4" />,
    horasSugeridas: { inicio: '07:00', fin: '17:00' },
    procesoDefecto: 'Horario Laboral',
    busquedaProceso: ['horario', 'laboral', 'entrada', 'salida', 'asistencia', 'turno', 'jornada'],
    template: {
      oti: 'VR',
      areaProduccion: 'Administración', // Se configurará automáticamente
      procesos: [],
      maquina: [],
      insumos: [],
      tipoTiempo: 'Horario Laboral',
      horaInicio: '',
      horaFin: '',
      observaciones: 'Control de horario laboral - Entrada y salida'
    }
  },
  {
    id: 'reunion-inicial',
    nombre: 'Reunión Inicial',
    descripcion: 'Reunión diaria de inicio de turno',
    color: 'from-blue-500 to-blue-600',
    icono: <Users className="w-4 h-4" />,
    horasSugeridas: { inicio: '07:00', fin: '07:15' },
    procesoDefecto: 'Reunion Inicial', // Nombre por defecto del proceso
    busquedaProceso: ['reunion', 'reunión', 'inicial', 'coordinacion', 'coordinación', 'planificacion', 'planificación', 'inicio'],
    template: {
      oti: 'VR',
      areaProduccion: '', // Se configurará automáticamente
      procesos: [], // Se configurará automáticamente
      maquina: [], // Se configurará automáticamente
      insumos: [],
      tipoTiempo: 'Preparación',
      horaInicio: '', // Editable
      horaFin: '', // Editable
      observaciones: ''
    }
  },
  {
    id: 'desayuno',
    nombre: 'Desayuno',
    descripcion: 'Tiempo de alimentación - desayuno',
    color: 'from-orange-500 to-orange-600',
    icono: <Coffee className="w-4 h-4" />,
    horasSugeridas: { inicio: '10:00', fin: '10:20' },
    procesoDefecto: 'Desayuno',
    busquedaProceso: ['desayuno', 'alimentacion', 'alimentación', 'comida', 'merienda', 'refrigerio'],
    template: {
      oti: 'VR',
      areaProduccion: '',
      procesos: [],
      maquina: [],
      insumos: [],
      tipoTiempo: 'Alimentación',
      horaInicio: '',
      horaFin: '',
      observaciones: ''
    }
  },
  {
    id: 'almuerzo',
    nombre: 'Almuerzo',
    descripcion: 'Tiempo de alimentación - almuerzo',
    color: 'from-green-500 to-green-600',
    icono: <Utensils className="w-4 h-4" />,
    horasSugeridas: { inicio: '13:00', fin: '13:30' },
    procesoDefecto: 'Almuerzo',
    busquedaProceso: ['almuerzo', 'alimentacion', 'alimentación', 'comida', 'lunch'],
    template: {
      oti: 'VR',
      areaProduccion: '',
      procesos: [],
      maquina: [],
      insumos: [],
      tipoTiempo: 'Alimentación',
      horaInicio: '',
      horaFin: '',
      observaciones: ''
    },

  },
  {
    id: 'permiso-laboral',
    nombre: 'Permiso Laboral',
    descripcion: 'Permisos laborales, licencias y ausencias justificadas',
    color: 'from-purple-500 to-purple-600',
    icono: <FileCheck className="w-4 h-4" />,
    horasSugeridas: { inicio: '', fin: '' },
    procesoDefecto: 'Permiso Laboral',
    busquedaProceso: ['permiso', 'licencia', 'ausencia', 'justificada', 'laboral', 'personal', 'salud', 'banco', 'tiempo'],
    template: {
      oti: 'No Aplica',
      areaProduccion: '',
      procesos: [],
      maquina: [],
      insumos: [],
      tipoTiempo: 'Permiso Laboral',
      tipoPermiso: '',
      horaInicio: '',
      horaFin: '',
      observaciones: '' 
    }
  }
];