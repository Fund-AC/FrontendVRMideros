import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { toast } from 'react-toastify';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { Card } from '../components/ui';

// Iconos para las tarjetas KPI
const KpiIcons = {
  Jornadas: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Minutos: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Registros: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
};

// Componente para tarjetas KPI
const ResumenKPI = ({ title, value, icon, bgColor, textColor}) => {
  return (
    <Card className={`${bgColor} p-6 rounded-2xl shadow-lg transition-transform transform hover:scale-105 border-none`}>
      <div className="flex justify-between items-start">
                        <div>
          <h3 className="text-sm font-semibold text-gray-600 tracking-wide">{title}</h3>
          <p className={`text-4xl font-extrabold ${textColor} mt-1 drop-shadow-sm`}>{value}</p>          
        </div>
        <div className="p-2">
          {icon}
        </div>
      </div>
    </Card>
  );
};

// Componente para tabla de jornadas recientes
const TablaJornadasRecientes = ({ jornadas, loading, navigate }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-gray-500">Cargando jornadas recientes...</p>
      </div>
    );
  }

        if (!jornadas || !Array.isArray(jornadas) || jornadas.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-lg shadow">
        <p className="text-gray-500">No hay jornadas recientes para mostrar</p>
      </div>
    );
  }

  // Filtrar jornadas que tengan al menos una actividad (registros)
  const jornadasConActividades = jornadas.filter(j => Array.isArray(j.registros) && j.registros.length > 0);

  if (jornadasConActividades.length === 0) {
    return (
      <div className="flex justify-center items-center h-48 bg-white rounded-lg shadow">
        <p className="text-gray-500">No hay jornadas recientes con actividades para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-x-auto border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Operario</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Fecha</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Hora Inicio</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Hora Fin</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Tiempo Total</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {jornadasConActividades.map((jornada, idx) => (
            <tr key={jornada._id} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50" + " hover:bg-blue-50 transition-colors"}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                {jornada.operario?.name || 'Sin asignar'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(jornada.fecha).toLocaleDateString('es-CO', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {jornada.horaInicio ? new Date(jornada.horaInicio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {jornada.horaFin ? new Date(jornada.horaFin).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-bold">
                {jornada.totalTiempoActividades?.horas || 0}h {jornada.totalTiempoActividades?.minutos || 0}m
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={() => navigate(`/admin/jornada/${jornada._id}`)}
                  className="text-indigo-600 hover:text-indigo-900 font-semibold px-3 py-1 rounded transition-colors bg-indigo-50 hover:bg-indigo-100"
                >
                  Ver detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

    const ajustarFechaLocal = (fechaUTC) => {
  const fecha = new Date(fechaUTC);
  return new Date(fecha.getTime() + fecha.getTimezoneOffset() * 60000);
};

    const AdminHome = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    jornadasHoy: 0,
    minutosHoy: 0,
    registrosHoy: 0,
  });
  const [jornadasRecientes, setJornadasRecientes] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Obtener resumen de KPIs
        const kpiResponse = await axiosInstance.get('/admin/dashboard/kpi');
        setKpis(kpiResponse.data);

        // Obtener jornadas recientes
        const jornadasResponse = await axiosInstance.get('/jornadas?limit=5&sort=fecha:desc');
        // El backend devuelve {jornadas: [...], pagination: {...}}
        const jornadasData = jornadasResponse.data.jornadas || jornadasResponse.data;
        setJornadasRecientes(Array.isArray(jornadasData) ? jornadasData : []);
      } catch (error) {
        console.error("Error al cargar datos del dashboard:", error);
        toast.error("No se pudieron cargar los datos del dashboard.");
        setJornadasRecientes([]);
      } finally {
        setLoading(false);
      }
    };
    

    fetchDashboardData();

    // Actualizar los datos cada 5 minutos
    const interval = setInterval(fetchDashboardData, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>  
      <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        <SidebarAdmin />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6">
            {/* Encabezado */}
                        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">Panel de Administración</h1>
                <p className="text-lg text-gray-500 mt-2">Bienvenido al sistema de gestión de producción</p>
              </div>
              {/* Logo removed from here */}
            </div>

            {/* Tarjetas KPI */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-700 mb-6 tracking-tight">Resumen del día</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"> {/* Changed to lg:grid-cols-3 and gap-6 */}
                <ResumenKPI
                  title="Jornadas Activas"
                  value={loading ? "..." : kpis.jornadasHoy}
                  icon={KpiIcons.Jornadas}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
                />
                <ResumenKPI
                  title="Minutos Trabajados"
                  value={loading ? "..." : kpis.minutosHoy}
                  icon={KpiIcons.Minutos}
                  bgColor="bg-green-50"
                  textColor="text-green-600"
                />
                <ResumenKPI
                  title="Registros Hoy"
                  value={loading ? "..." : kpis.registrosHoy}
                  icon={KpiIcons.Registros}
                  bgColor="bg-purple-50"
                  textColor="text-purple-600"
                />
              </div>
            </section>

            {/* Jornadas Recientes y Accesos Rápidos */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              {/* Jornadas Recientes */}
              <section className="lg:col-span-2">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                  <h2 className="text-2xl font-bold text-gray-700 tracking-tight">Jornadas Recientes</h2>
                  <button
                    onClick={() => navigate('/admin/jornadas')}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center"
                  >
                    Ver todas
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
                <TablaJornadasRecientes
                  jornadas={jornadasRecientes}
                  loading={loading}
                  navigate={navigate}
                />
              </section>

              {/* Botones de Acceso Rápido */}
              <section className="lg:col-span-1">
                <h2 className="text-2xl font-bold text-gray-700 mb-6 tracking-tight">Accesos Rápidos</h2>
                <div className="grid grid-cols-1 gap-4"> {/* Reduced gap from gap-6 to gap-4 */}
                  <button
                    onClick={() => navigate('/admin/operarios')}
                    className="flex items-center p-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-all group min-h-[40px]" /* Adjusted padding, min-height and removed flex-col, items-start, justify-between */
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-white opacity-90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    <div className="text-left"> {/* Ensured text is aligned left */}
                      <span className="font-semibold text-m">Gestionar Operarios</span> {/* Adjusted font size */}
                      <p className="text-xs text-blue-200 mt-0.5">Administrar personal</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/admin/procesos')}
                    className="flex items-center p-4 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition-all group min-h-[40px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-white opacity-90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 010 1.255c-.008.378.137.75.43.991l1.004.827c.432.356.533.98.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.61 6.61 0 01-.22.128c-.332.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.538 6.538 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.759 6.759 0 010-1.255c.008-.378-.137-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="text-left">
                      <span className="font-semibold text-m">Gestionar Procesos</span>
                      <p className="text-xs text-purple-200 mt-0.5">Configurar workflows</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate('/admin/maquinas')}
                    className="flex items-center p-4 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition-all group min-h-[40px]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-white opacity-90 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.471-2.471a3.75 3.75 0 00-5.303-5.303l-2.471 2.471M11.42 15.17L5.877 21M11.42 15.17l2.471 2.471M18.375 3.622L17.25 4.75M9.75 9.75L8.625 8.625M3 12.75l1.125-1.125" />
                    </svg>
                    <div className="text-left">
                      <span className="font-semibold text-m">Gestionar Máquinas</span>
                      <p className="text-xs text-green-200 mt-0.5">Control de equipos</p>
                    </div>
                  </button>
                </div>
              </section>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default AdminHome;
