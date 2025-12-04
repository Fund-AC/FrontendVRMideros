import React, { useEffect, useState, useCallback } from "react"; // Added useCallback
import axiosInstance from "../utils/axiosInstance";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation
import { toast } from "react-toastify";
import { Button, Card } from "../components/ui";
import { Sidebar } from "../components/Sidebar";
import EditarProduccion from "./EditarProduccion";
import { Pencil, Trash2 } from "lucide-react"; // Importing icons
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import useInactivityTimeout from "../hooks/useInactivityTimeout";

const ajustarFechaLocal = (fechaUTC) => {
  // Crear una nueva fecha basada en la fecha UTC recibida
  // pero interpretada como fecha local para evitar problemas de zona horaria
  const fecha = new Date(fechaUTC);
  const year = fecha.getUTCFullYear();
  const month = fecha.getUTCMonth();
  const day = fecha.getUTCDate();
  // Crear fecha local con los componentes UTC para evitar desfase de zona horaria
  return new Date(year, month, day);
};

const MiJornada = () => {
  const [jornadaActual, setJornadaActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActividad, setSelectedActividad] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Get location object

  const storedOperario = JSON.parse(localStorage.getItem('operario'));
  const operarioName = storedOperario?.name || 'Operario';

  // Hook para manejar timeout por inactividad
  useInactivityTimeout(15 * 60 * 1000); // 15 minutos

  const fetchJornadas = useCallback(async () => {
    try {
      setLoading(true);
      const localStoredOperario = JSON.parse(localStorage.getItem("operario"));
      if (!localStoredOperario || !localStoredOperario._id) {
        toast.error("No se encontró información del operario. Por favor, inicie sesión nuevamente.");
        navigate("/validate-cedula");
        return;
      }
      const operarioId = localStoredOperario._id;
      const response = await axiosInstance.get(`/jornadas/operario/${operarioId}`);
      const jornadas = response.data;
      console.log("Todas las jornadas recibidas:", jornadas); const currentJornada = jornadas.find((jornada) => {
        const fechaJornada = ajustarFechaLocal(jornada.fecha).toDateString();
        // Usar fecha actual local sin ajustes de zona horaria
        const today = new Date();
        const fechaHoy = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toDateString();
        return fechaJornada === fechaHoy;
      });
      console.log("Jornada actual encontrada:", currentJornada);
      setJornadaActual(currentJornada);
    } catch (error) {
      console.error("Error al obtener la jornada actual:", error);

      // Mejorar el mensaje de error
      let errorMessage = "No se pudo cargar la jornada actual.";

      if (error.message?.includes('sesión ha expirado')) {
        errorMessage = "Tu sesión ha expirado. Redirigiendo al login...";
      } else if (error.response?.status === 401) {
        errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente.";
      } else if (error.response?.status === 403) {
        errorMessage = "No tienes permisos para acceder a esta información.";
      }

      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [navigate]); // useCallback dependencies remain the same

  useEffect(() => {
    fetchJornadas();
  }, [fetchJornadas, location]); // Add location to the dependency array


  const handleEditarActividad = (actividad) => {
    setSelectedActividad(actividad);
    setIsEditModalOpen(true);
  };
  // Función para manejar confirmación de eliminación
  const handleDeleteConfirmation = (actividadId) => {
    confirmAlert({
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que quieres eliminar esta actividad? Esta acción es irreversible.',
      buttons: [
        {
          label: 'Sí, eliminar',
          onClick: () => {
            handleEliminarActividad(actividadId);
          },
          className: 'bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg'
        },
        {
          label: 'Cancelar',
          onClick: () => toast.info('Eliminación cancelada.'),
          className: 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg'
        }
      ],
      closeOnEscape: true,
      closeOnClickOutside: true,
      overlayClassName: "custom-overlay-confirm-alert"
    });
  };

  const handleEliminarActividad = async (actividadId) => {
    try {
      console.log(`Intentando eliminar actividad con ID: ${actividadId}`);

      // 1. Eliminar la actividad
      const response = await axiosInstance.delete(`/produccion/eliminar/${actividadId}`);
      console.log("Respuesta de eliminación:", response.data);

      toast.success("Actividad eliminada con éxito");
      // No es necesario actualizar localmente los registros si vamos a re-fetchear toda la jornada
      // setJornadaActual((prev) => ({
      //   ...prev,
      //   registros: prev.registros.filter((registro) => registro._id !== actividadId),
      // }));
      await fetchJornadas(); // Re-fetch jornada data to show updated totals and details
    } catch (error) {
      console.error("Error al eliminar la actividad:", error);
      toast.error("No se pudo eliminar la actividad.");
    }
  };

  return (
    <div className="flex bg-gray-100 h-screen">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-8 max-w-full px-4">
          <div className="container mx-auto px-4 py-6 max-w-full">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
                  Mi Jornada Actual</h1>
                <p className="text-md text-gray-500">
                  Bienvenido, <span className="font-semibold">{operarioName}</span>
                </p>
              </div>
              <Button
                onClick={() => navigate("/registro-produccion")}
                 className="group relative items-center gap-3 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md text-white px-6 py-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-medium text-sm border border-blue-500/20"
              >
                Agregar actividad
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-48">
                <p className="text-lg text-gray-600">Cargando información de la jornada...</p>
              </div>
            ) : jornadaActual && jornadaActual.registros && jornadaActual.registros.length > 0 ? (
              <>
               <Card className="mb-6 bg-gray shadow-xl rounded-2xl border border-gray-400">
  <div className="bg-gray-700 text-white p-6 rounded-lg shadow-lg">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-center">
      {/* Título ocupa más espacio */}
      <div className="lg:col-span-1">
        <h2 className="text-2xl font-semibold border-b text-white border-gray-600 pb-2">
          Detalles de la Jornada
        </h2>
      </div>
      
      {/* Datos distribuidos en 4 columnas */}
      <div className="text-sm">
        <strong className="block text-gray-300">Fecha:</strong>
        <span>{ajustarFechaLocal(jornadaActual.fecha).toLocaleDateString()}</span>
      </div>
      
      <div className="text-sm">
        <strong className="block text-gray-300">Tiempo Total:</strong>
        <span>
          {jornadaActual.totalTiempoActividades && 
           typeof jornadaActual.totalTiempoActividades.horas === 'number' && 
           typeof jornadaActual.totalTiempoActividades.minutos === 'number' 
            ? `${jornadaActual.totalTiempoActividades.horas}h ${jornadaActual.totalTiempoActividades.minutos}m` 
            : (jornadaActual.totalTiempoActividades || 'N/A')}
        </span>
      </div>
      
      <div className="text-sm">
        <strong className="block text-gray-300">Inicio de Jornada:</strong>
        <span>{jornadaActual.horaInicio ? new Date(jornadaActual.horaInicio).toLocaleTimeString() : 'N/A'}</span>
      </div>
      
      <div className="text-sm">
        <strong className="block text-gray-300">Fin de Jornada:</strong>
        <span>{jornadaActual.horaFin ? new Date(jornadaActual.horaFin).toLocaleTimeString() : 'N/A'}</span>
      </div>
    </div>
  </div>
</Card>

                <h2 className="text-2xl font-semibold mt-8 mb-4 text-gray-800 border-b pb-2 border-gray-300">
                  Actividades Registradas
                </h2>

                <div className="bg-white shadow-md rounded-lg border border-gray-200 overflow-x-auto">
                  <table className="w-full min-w-max divide-y divide-gray-300 table-fixed">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3 pl-4 pr-2 text-left text-sm font-semibold text-gray-900" style={{ width: '15%', minWidth: '120px' }}>Proceso</th>
                        <th scope="col" className="px-2 py-3 text-left text-sm font-semibold text-gray-900" style={{ width: '8%', minWidth: '70px' }}>OTI</th>
                        <th scope="col" className="px-2 py-3 text-left text-sm font-semibold text-gray-900" style={{ width: '12%', minWidth: '100px' }}>Área</th>
                        <th scope="col" className="px-2 py-3 text-left text-sm font-semibold text-gray-900" style={{ width: '15%', minWidth: '120px' }}>Máquina</th>
                        <th scope="col" className="px-2 py-3 text-left text-sm font-semibold text-gray-900" style={{ width: '15%', minWidth: '120px' }}>Insumos</th>
                        <th scope="col" className="px-2 py-3 text-left text-sm font-semibold text-gray-900" style={{ width: '10%', minWidth: '80px' }}>Tipo</th>
                        <th scope="col" className="px-2 py-3 text-center text-sm font-semibold text-gray-900" style={{ width: '8%', minWidth: '70px' }}>Inicio</th>
                        <th scope="col" className="px-2 py-3 text-center text-sm font-semibold text-gray-900" style={{ width: '8%', minWidth: '70px' }}>Fin</th>
                        <th scope="col" className="px-2 py-3 text-center text-sm font-semibold text-gray-900" style={{ width: '8%', minWidth: '60px' }}>Min</th>
                        <th scope="col" className="px-2 py-3 text-left text-sm font-semibold text-gray-900" style={{ width: '18%', minWidth: '140px' }}>Observaciones</th>
                        <th scope="col" className="relative py-3 pl-2 pr-4 text-center text-sm font-semibold text-gray-900" style={{ width: '8%', minWidth: '80px' }}>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {jornadaActual.registros
                        .sort((a, b) => new Date(a.horaInicio) - new Date(b.horaInicio))
                        .map((actividad) => (
                          <tr key={actividad._id} className="hover:bg-gray-50">
                            <td className="py-3 pl-4 pr-2 text-sm text-gray-900" style={{ width: '15%', minWidth: '120px' }}>
                              <div className="break-words leading-relaxed">
                                {actividad.procesos && actividad.procesos.length > 0 ? (
                                  actividad.procesos.map(p => p.nombre).join(', ')
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500" style={{ width: '8%', minWidth: '70px' }}>
                              <div className="break-words leading-relaxed">{actividad.oti?.numeroOti || "N/A"}</div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500" style={{ width: '12%', minWidth: '100px' }}>
                              <div className="break-words leading-relaxed">{actividad.areaProduccion?.nombre || "N/A"}</div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500" style={{ width: '15%', minWidth: '120px' }}>
                              <div className="break-words leading-relaxed">
                                {actividad.maquina && actividad.maquina.length > 0 ? (
                                  actividad.maquina.map(i => i.nombre).join(', ')
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500" style={{ width: '15%', minWidth: '120px' }}>
                              <div className="break-words leading-relaxed">
                                {actividad.insumos && actividad.insumos.length > 0 ? (
                                  actividad.insumos.map(i => i.nombre).join(', ')
                                ) : (
                                  "N/A"
                                )}
                              </div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500" style={{ width: '10%', minWidth: '80px' }}>
                              <div className="break-words leading-relaxed">{actividad.tipoTiempo || "N/A"}</div>
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center" style={{ width: '8%', minWidth: '70px' }}>
                              {actividad.horaInicio ? new Date(actividad.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center" style={{ width: '8%', minWidth: '70px' }}>
                              {actividad.horaFin ? new Date(actividad.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500 text-center" style={{ width: '8%', minWidth: '60px' }}>
                              {actividad.tiempo}
                            </td>
                            <td className="px-2 py-3 text-sm text-gray-500" style={{ width: '18%', minWidth: '140px' }}>
                              <div className="break-words leading-relaxed">
                                {actividad.observaciones || "N/A"}
                              </div>
                            </td>
                            <td className="relative py-3 pl-2 pr-4 text-center" style={{ width: '8%', minWidth: '80px' }}>
                              <div className="flex flex-row gap-2 items-center justify-center">
                                <button
                                  onClick={() => handleEditarActividad(actividad)}
                                 className="bg-gradient-to-br from-teal-400 to-teal-600 text-white font-semibold px-2 py-1 rounded text-sm hover:bg-green-300 transition-all duration-300 cursor-pointer gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Editar"
                                >
                                  <Pencil size={14} className="inline" />
                                </button>
                                <button
                                  onClick={() => handleDeleteConfirmation(actividad._id)}
                                  className="bg-red-300 text-red-600 font-semibold px-2 py-1 rounded text-sm hover:bg-red-300 transition-all duration-300 cursor-pointer gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
                                  title="Eliminar"
                                >
                                  <Trash2 size={14} className="inline" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <Card className="flex flex-col items-center justify-center p-8 text-center bg-white shadow-md rounded-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">¡Hola, {operarioName}!</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Parece que no tienes una jornada activa registrada para hoy.
                </p>
                <Button
                  onClick={() => navigate("/registro-produccion")}
                   className="group relative items-center gap-3 p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md text-white px-6 py-3 hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 font-medium text-sm border border-blue-500/20"
                >
                  <span className="flex items-center space-x-2">
                    <span>Comenzar Nueva Jornada</span>
                  </span>
                </Button>
              </Card>
            )}
          </div>
        </div>

        {/* MODAL FOR EDITING PRODUCCION */}
        {isEditModalOpen && selectedActividad && (
          <EditarProduccion
            produccion={selectedActividad}
            onClose={() => {
              setIsEditModalOpen(false);
              setSelectedActividad(null);
            }}
            onGuardar={() => {
              setIsEditModalOpen(false);
              setSelectedActividad(null);
              fetchJornadas(); // Re-fetch jornada data to show updated info
            }}

            invokedAsModal={true}
          />
        )}
      </div>
    </div>
  );

};

export default MiJornada;

