import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx-js-style';
import axiosInstance from '../utils/axiosInstance';
import Pagination from '../components/Pagination';
import { toast } from 'react-toastify';
import { Button, Card } from '../components/ui';
import DetalleJornadaModal from '../components/DetalleJornadaModal';
import { SidebarAdmin } from '../components/SidebarAdmin';
import { useNavigate } from 'react-router-dom';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { REFRESH_CONFIG } from '../utils/refreshConfig';
import { debounce } from 'lodash';

// Helper function to parse dates as local time
const parseLocalDate = (dateString) => {
    if (!dateString) return null;
    // Assuming dateString is in 'YYYY-MM-DD' format from input type="date"
    // or a full ISO string from the backend that needs to be treated as local
    const [year, month, day] = dateString.split('T')[0].split('-').map(Number);
    return new Date(year, month - 1, day); // Month is 0-indexed
};

// Componente memoizado para filas de la tabla
const JornadaRow = React.memo(({ jornada, index, onViewDetails }) => {
    const fechaStr = useMemo(() => {
        if (!jornada.fecha) return 'N/A';
        // Extraer solo la parte de la fecha para evitar ajuste de zona horaria
        const fecha = jornada.fecha.split('T')[0];
        const [year, month, day] = fecha.split('-');
        return new Date(year, month - 1, day).toLocaleDateString();
    }, [jornada.fecha]);

    const horaJornada = useMemo(() => {
        if (!jornada.horaInicio || !jornada.horaFin) return 'N/A';

        const inicio = new Date(jornada.horaInicio).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        const fin = new Date(jornada.horaFin).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
        return `${inicio} - ${fin}`;
    }, [jornada.horaInicio, jornada.horaFin]);

    // Procesar permisos laborales de los registros
    const permisosInfo = useMemo(() => {
        const permisos = jornada.registros?.filter(registro =>
            registro.tipoTiempo === 'Permiso Laboral'
        ) || [];

        if (permisos.length === 0) {
            return {
                horarios: ['-'],
                tipos: ['-'],
                observaciones: ['-']
            };
        }

        const horarios = permisos.map(permiso => {
            const inicio = permiso.horaInicio ?
                new Date(permiso.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
            const fin = permiso.horaFin ?
                new Date(permiso.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
            return `${inicio} - ${fin}`;
        });

        const tipos = [...new Set(permisos.map(permiso => permiso.tipoPermiso || 'N/A'))];

        const observaciones = permisos
            .filter(permiso => permiso.observaciones && permiso.observaciones.trim())
            .map(permiso => permiso.observaciones.trim());

        return {
            horarios,
            tipos,
            observaciones: observaciones.length > 0 ? observaciones : ['-']
        };
    }, [jornada.registros]);

    const tiempoTotalAPagar = useMemo(() => {
        // Tiempo base (ya tiene descontados los permisos NO remunerados)
        const tiempoBase = jornada.tiempoEfectivoAPagar || { horas: 0, minutos: 0 };
        let tiempoTotalMinutos = (tiempoBase.horas * 60) + tiempoBase.minutos;

        // Buscar y descontar tiempo de almuerzo
        const almuerzos = jornada.registros?.filter(registro => {
            return registro.procesos?.some(proceso => 
                proceso.nombre?.toLowerCase().includes('almuerzo')
            );
        }) || [];
        
        const tiempoAlmuerzoMinutos = almuerzos.reduce((total, almuerzo) => {
            return total + (almuerzo.tiempo || 0);
        }, 0);

        console.log(`🕒 Tiempo total: ${tiempoTotalMinutos}min, Almuerzo: ${tiempoAlmuerzoMinutos}min, Resultado: ${tiempoTotalMinutos - tiempoAlmuerzoMinutos}min`);

        // Descontar almuerzo
        tiempoTotalMinutos = Math.max(0, tiempoTotalMinutos - tiempoAlmuerzoMinutos);

        const horas = Math.floor(tiempoTotalMinutos / 60);
        const minutos = tiempoTotalMinutos % 60;
        
        return `${horas}h ${minutos}m`;
    }, [jornada.tiempoEfectivoAPagar, jornada.registros]);

    return (
        <tr
            className={`border-b last:border-b-0 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                } hover:bg-blue-50 transition-colors`}
        >
            <td className="p-3 whitespace-nowrap">{fechaStr}</td>
            <td className="p-3 whitespace-nowrap">{jornada.operario?.name || 'N/A'}</td>
            <td className="p-3 whitespace-nowrap text-center">{horaJornada}</td>
            <td className="p-3 text-center text-sm whitespace-pre-line">
                {permisosInfo.horarios.map((horario, idx) => (
                    <div key={idx} className="leading-tight">{horario}</div>
                ))}
            </td>
            <td className="p-3 text-sm whitespace-pre-line">
                {permisosInfo.tipos.map((tipo, idx) => (
                    <div key={idx} className="leading-tight">{tipo}</div>
                ))}
            </td>
            <td className="p-3 max-w-xs text-sm">
                {permisosInfo.observaciones.map((obs, idx) => (
                    <div key={idx} className="leading-tight truncate" title={obs}>
                        {obs}
                    </div>
                ))}
            </td>
            <td className="p-3 whitespace-nowrap">
                <span className="font-medium text-green-600">{tiempoTotalAPagar}</span>
            </td>            
        </tr>
    );
});

const ConsultaJornadasOptimized = () => {
    const navigate = useNavigate();

    // Estados principales
    const [jornadas, setJornadas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10
    });

    // Estados de filtros
    const [filters, setFilters] = useState({
        search: "",
        fechaInicio: "",
        fechaFin: ""
    });

    const [selectedJornadaId, setSelectedJornadaId] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Función debounced para búsqueda
    const debouncedSearch = useCallback(
        debounce((searchTerm, fechaInicio, fechaFin) => {
            fetchJornadas(1, searchTerm, fechaInicio, fechaFin);
        }, 500),
        []
    );

    // Fetch optimizado con paginación
    const fetchJornadas = useCallback(async (
        page = 1,
        operario = filters.search,
        fechaInicio = filters.fechaInicio,
        fechaFin = filters.fechaFin,
        showLoadingSpinner = true
    ) => {
        if (showLoadingSpinner) setLoading(true);

        try {           
            const params = new URLSearchParams({
                page: page.toString(),
                limit: pagination.itemsPerPage.toString(),
                includeRegistros: 'true' // Necesitamos los registros para mostrar permisos
            }); if (operario) params.append('operario', operario);
            if (fechaInicio) params.append('fechaInicio', fechaInicio);
            if (fechaFin) params.append('fechaFin', fechaFin);

            // Cache busting solo para refresh manual
            if (showLoadingSpinner) {
                params.append('t', Date.now().toString());
            }

            const response = await axiosInstance.get(`/jornadas/paginadas?${params}`);            

            setJornadas(response.data.jornadas || []);

            const paginationData = response.data.pagination || {
                currentPage: 1,
                totalPages: 0,
                totalItems: 0,
                itemsPerPage: 10
            };

            setPagination(paginationData);
            setLastUpdated(new Date());

        } catch (error) {
            console.error('Error al cargar jornadas:', error);
            if (showLoadingSpinner) {
                toast.error('No se pudieron cargar las jornadas. Intenta de nuevo más tarde.');
            }
            setJornadas([]);
        } finally {
            if (showLoadingSpinner) setLoading(false);
        }
    }, [filters.search, filters.fechaInicio, filters.fechaFin, pagination.itemsPerPage]);

    // Cargar datos inicial
    useEffect(() => {
        fetchJornadas(1);
    }, []);

    // Auto-refresh optimizado (solo refresh sin spinner)
    useAutoRefresh(() => {
        fetchJornadas(pagination.currentPage, undefined, undefined, undefined, false);
    }, REFRESH_CONFIG.PAGES.CONSULTA_JORNADAS);

    // Manejar cambios de filtros con debounce
    useEffect(() => {
        debouncedSearch(filters.search, filters.fechaInicio, filters.fechaFin);
        return () => debouncedSearch.cancel();
    }, [filters.search, filters.fechaInicio, filters.fechaFin, debouncedSearch]);

    // Handlers memoizados
    const handleFilterChange = useCallback((field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value
        }));
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, []);

    const handlePageChange = useCallback((newPage) => {
        setPagination(prev => ({ ...prev, currentPage: newPage }));
        fetchJornadas(newPage);
    }, [fetchJornadas]);

    const handleRefresh = useCallback(() => {
        fetchJornadas(pagination.currentPage);
    }, [fetchJornadas, pagination.currentPage]);

    const handleViewDetails = useCallback((jornadaId) => {
        navigate(`/admin/jornada/${jornadaId}`);
    }, [navigate]);

    // Función optimizada de exportación
    const exportarJornadasExcel = useCallback(async () => {
        try {
            // Mostrar mensaje de procesamiento
            toast.info('Preparando exportación... Esto puede tomar unos momentos.');

            // Hacer una consulta especial para obtener TODOS los registros filtrados
            const params = new URLSearchParams({
                page: '1',
                limit: '1000', // Límite alto para obtener todos los registros
                includeRegistros: 'true' // Necesitamos los registros para calcular permisos
            });

            // Aplicar los mismos filtros que están activos en la interfaz
            if (filters.search) params.append('operario', filters.search);
            if (filters.fechaInicio) params.append('fechaInicio', filters.fechaInicio);
            if (filters.fechaFin) params.append('fechaFin', filters.fechaFin);

            console.log('🔍 Exportando con filtros:', {
                operario: filters.search || 'Todos',
                fechaInicio: filters.fechaInicio || 'Sin filtro',
                fechaFin: filters.fechaFin || 'Sin filtro'
            });

            const response = await axiosInstance.get(`/jornadas/paginadas?${params}`);
            const jornadasCompletas = response.data.jornadas || [];

            if (jornadasCompletas.length === 0) {
                toast.info('No hay jornadas para exportar con los filtros aplicados.');
                return;
            }

            console.log(`📊 Exportando ${jornadasCompletas.length} jornadas filtradas`);

            // Función para convertir minutos a horas decimales
            const minutosAHorasDecimales = (minutos) => {
                if (minutos <= 0) return 0;
                return parseFloat((minutos / 60).toFixed(2));
            };

            const datosParaExcel = [];

            jornadasCompletas.forEach(j => {
                const fechaJornada = parseLocalDate(j.fecha);
                const fechaStr = fechaJornada ? fechaJornada.toLocaleDateString() : 'N/A';
                const operarioNombre = j.operario?.name || 'N/A';

                // Calcular horarios de jornada
                const horaInicioJornada = j.horaInicio ? new Date(j.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                const horaFinJornada = j.horaFin ? new Date(j.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';

                // Calcular duración total de jornada en minutos
                let tiempoTotalJornadaMinutos = 0;
                if (j.horaInicio && j.horaFin) {
                    const inicio = new Date(j.horaInicio);
                    let fin = new Date(j.horaFin);

                    // Si la hora de fin es menor que la de inicio, asumimos que es del día siguiente
                    if (fin <= inicio) {
                        fin = new Date(fin.getTime() + 24 * 60 * 60 * 1000);
                    }

                    tiempoTotalJornadaMinutos = Math.round((fin - inicio) / (1000 * 60));
                }

                // Buscar y descontar tiempo de almuerzo si existe
                // Filtrar registros de producción que tengan el proceso "Almuerzo"
                const almuerzos = j.registros?.filter(registro => {
                    // registro.procesos es un array de referencias a Proceso
                    return registro.procesos?.some(proceso => 
                        proceso.nombre?.toLowerCase().includes('almuerzo')
                    );
                }) || [];
                
                const tiempoAlmuerzoMinutos = almuerzos.reduce((total, almuerzo) => {
                    return total + (almuerzo.tiempo || 0);
                }, 0);

                // Descontar almuerzo del total de jornada
                if (tiempoAlmuerzoMinutos > 0) {
                    tiempoTotalJornadaMinutos = Math.max(0, tiempoTotalJornadaMinutos - tiempoAlmuerzoMinutos);
                }

                const tiempoTotalJornadaFormateado = tiempoTotalJornadaMinutos > 0
                    ? `${Math.floor(tiempoTotalJornadaMinutos / 60)}h ${tiempoTotalJornadaMinutos % 60}m`
                    : '';

                // Buscar permisos laborales en los registros
                const permisos = j.registros?.filter(registro =>
                    registro.tipoTiempo === 'Permiso Laboral'
                ) || [];

                // Agrupar permisos por tipo y calcular totales
                let totalPermisosRemunerados = 0;
                let totalPermisosNoRemunerados = 0;
                let permisosRemuneradosInfo = [];
                let permisosNoRemuneradosInfo = [];
                let todasObservaciones = [];

                permisos.forEach(permiso => {
                    const tiempoPermisoMinutos = permiso.tiempo || 0;
                    const tipoPermisoOriginal = (permiso.tipoPermiso || '').toLowerCase();

                    if (tipoPermisoOriginal === 'permiso remunerado') {
                        totalPermisosRemunerados += tiempoPermisoMinutos;
                        const horaInicio = permiso.horaInicio ? new Date(permiso.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                        const horaFin = permiso.horaFin ? new Date(permiso.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                        permisosRemuneradosInfo.push(`${horaInicio}-${horaFin}`);
                    } else if (tipoPermisoOriginal === 'permiso no remunerado') {
                        totalPermisosNoRemunerados += tiempoPermisoMinutos;
                        const horaInicio = permiso.horaInicio ? new Date(permiso.horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                        const horaFin = permiso.horaFin ? new Date(permiso.horaFin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                        permisosNoRemuneradosInfo.push(`${horaInicio}-${horaFin}`);
                    }

                    if (permiso.observaciones && permiso.observaciones.trim()) {
                        todasObservaciones.push(permiso.observaciones.trim());
                    }
                });

                // Formatear tiempos de permisos
                const totalPermisosRemuneradosFormateado = totalPermisosRemunerados > 0
                    ? `${Math.floor(totalPermisosRemunerados / 60)}h ${totalPermisosRemunerados % 60}m`
                    : '0h 0m';

                const totalPermisosNoRemuneradosFormateado = totalPermisosNoRemunerados > 0
                    ? `${Math.floor(totalPermisosNoRemunerados / 60)}h ${totalPermisosNoRemunerados % 60}m`
                    : '0h 0m';

                // Calcular tiempo efectivo a pagar: Jornada - Permisos NO Remunerados
                const tiempoEfectivoMinutos = tiempoTotalJornadaMinutos - totalPermisosNoRemunerados;
                const tiempoEfectivoFormateado = tiempoEfectivoMinutos > 0
                    ? `${Math.floor(tiempoEfectivoMinutos / 60)}h ${tiempoEfectivoMinutos % 60}m`
                    : '0h 0m';

                // Convertir tiempo efectivo a horas decimales
                const tiempoEfectivoHorasDecimales = minutosAHorasDecimales(tiempoEfectivoMinutos);

                // Crear una sola fila por jornada (fecha + operario)
                datosParaExcel.push({
                    'Fecha': fechaStr,
                    'Operario': operarioNombre,
                    'Inicio jornada': horaInicioJornada,
                    'Fin Jornada': horaFinJornada,                    
                    'Total Jornada': tiempoTotalJornadaFormateado,
                    'Permisos Remunerados': totalPermisosRemuneradosFormateado,
                    'Horarios P. Remunerados': permisosRemuneradosInfo.join(', ') || '-',
                    'Permisos NO Remunerados': totalPermisosNoRemuneradosFormateado,
                    'Horarios P. NO Remunerados': permisosNoRemuneradosInfo.join(', ') || '-',
                    'Observaciones Permisos': todasObservaciones.join(' | ') || '-',
                    'Tiempo Total a Pagar': tiempoEfectivoFormateado,
                    'Tiempo Total a Pagar EN HORAS': tiempoEfectivoHorasDecimales
                });
            });

            try {
                const ws = XLSX.utils.json_to_sheet(datosParaExcel);

                // Configurar el ancho de las columnas
                const columnWidths = [
                    { wch: 12 }, // Fecha
                    { wch: 30 }, // Operario
                    { wch: 12 }, // Inicio jornada
                    { wch: 12 }, // Fin Jornada
                    { wch: 12 }, // Almuerzo
                    { wch: 15 }, // Total Jornada
                    { wch: 18 }, // Permisos Remunerados
                    { wch: 25 }, // Horarios P. Remunerados
                    { wch: 20 }, // Permisos NO Remunerados
                    { wch: 25 }, // Horarios P. NO Remunerados  
                    { wch: 30 }, // Observaciones Permisos      
                    { wch: 18 }, // Tiempo Total a Pagar
                    { wch: 25 }  // Tiempo Total a Pagar EN HORAS (formato decimal)
                ];
                ws['!cols'] = columnWidths;

                // Aplicar estilos a las celdas
                const range = XLSX.utils.decode_range(ws['!ref']);

                for (let R = range.s.r; R <= range.e.r; ++R) {
                    for (let C = range.s.c; C <= range.e.c; ++C) {
                        const cellAddress = XLSX.utils.encode_cell({ c: C, r: R });
                        if (!ws[cellAddress]) continue;

                        // Estilo para headers (fila 0)
                        if (R === 0) {
                            ws[cellAddress].s = {
                                fill: { fgColor: { rgb: "4A90E2" } },
                                font: { bold: true, color: { rgb: "FFFFFF" } },
                                alignment: { horizontal: "center", vertical: "center" },
                                border: {
                                    top: { style: "thin", color: { rgb: "000000" } },
                                    bottom: { style: "thin", color: { rgb: "000000" } },
                                    left: { style: "thin", color: { rgb: "000000" } },
                                    right: { style: "thin", color: { rgb: "000000" } }
                                }
                            };
                        } else {
                            // Estilo base para celdas de datos
                            let cellStyle = {
                                border: {
                                    top: { style: "thin", color: { rgb: "CCCCCC" } },
                                    bottom: { style: "thin", color: { rgb: "CCCCCC" } },
                                    left: { style: "thin", color: { rgb: "CCCCCC" } },
                                    right: { style: "thin", color: { rgb: "CCCCCC" } }
                                },
                                alignment: { vertical: "center" }
                            };

                            // Aplicar colores específicos a columnas de totales
                            if (C === 4) { // Total Jornada
                                cellStyle.fill = { fgColor: { rgb: "E8F5E8" } };
                                cellStyle.font = { color: { rgb: "2E7D32" } };
                            } else if (C === 5) { // Permisos Remunerados
                                cellStyle.fill = { fgColor: { rgb: "E3F2FD" } };
                                cellStyle.font = { color: { rgb: "1565C0" } };
                            } else if (C === 7) { // Permisos NO Remunerados
                                cellStyle.fill = { fgColor: { rgb: "FFEBEE" } };
                                cellStyle.font = { color: { rgb: "C62828" } };
                            } else if (C === 10 || C === 11) { // Tiempo Total a Pagar
                                cellStyle.fill = { fgColor: { rgb: "F3E5F5" } };
                                cellStyle.font = { color: { rgb: "7B1FA2" } };
                            }

                            ws[cellAddress].s = cellStyle;
                        }
                    }
                }

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Registro de Jornadas y Permisos');
                XLSX.writeFile(wb, 'registro_jornadas_y_permisos_laborales.xlsx');

                // Mensaje de éxito más informativo
                const cantidadJornadas = jornadasCompletas.length;
                const totalFilas = datosParaExcel.length;
                toast.success(`✅ Excel exportado exitosamente: ${cantidadJornadas} jornada${cantidadJornadas !== 1 ? 's' : ''} (${totalFilas} registro${totalFilas !== 1 ? 's' : ''} de detalle)`);
            } catch (exportError) {
                console.error("Error al generar el archivo Excel:", exportError);
                toast.error('Error al generar el archivo Excel. Intente de nuevo.');
            }
        } catch (error) {
            console.error("Error al exportar jornadas a Excel:", error);
            toast.error('Error al obtener los datos para exportar. Intente de nuevo.');
        }
    }, [filters, pagination.totalItems]);

    // Memoizar elementos de UI
    const statsInfo = useMemo(() => (
        <div className="text-sm text-gray-600">
            Mostrando {jornadas.length} de {pagination.totalItems} jornadas
        </div>
    ), [jornadas.length, pagination.totalItems, lastUpdated]);

    return (
        <div className="flex bg-gradient-to-br from-gray-100 via-blue-50 to-purple-50 h-screen">
            <SidebarAdmin />

            <div className="flex-1 overflow-auto">
                <div className="container mx-auto px-4 py-6">
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight drop-shadow-sm">
                            Consulta de Jornadas
                        </h1>
                        <p className="text-base md:text-lg text-gray-500 mt-1">
                            Visualiza, filtra y exporta las jornadas registradas.
                        </p>
                    </div>

                    <Card className="p-4 shadow-lg border border-gray-100">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold text-gray-700">Jornadas Registradas</h2>
                                {statsInfo}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleRefresh}
                                    className="shadow-sm self-start sm:self-center text-sm px-3 py-2"
                                    disabled={loading}
                                >
                                    {loading ? '🔄' : '↻'} Actualizar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={exportarJornadasExcel}
                                    className="shadow-sm self-start sm:self-center"
                                    disabled={pagination.totalItems === 0}
                                >
                                    Exportar a Excel
                                </Button>
                            </div>
                        </div>

                        {/* Filtros optimizados */}
                        <div className="flex flex-col md:flex-row gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Buscar por operario..."
                                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                value={filters.search}
                                onChange={(e) => handleFilterChange('search', e.target.value)}
                            />
                            <input
                                type="date"
                                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                value={filters.fechaInicio}
                                onChange={(e) => handleFilterChange('fechaInicio', e.target.value)}
                                title="Fecha de inicio"
                            />
                            <input
                                type="date"
                                className="border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                                value={filters.fechaFin}
                                onChange={(e) => handleFilterChange('fechaFin', e.target.value)}
                                title="Fecha de fin"
                            />
                        </div>

                        {/* Tabla optimizada */}
                        {loading && jornadas.length === 0 ? (
                            <div className="flex justify-center items-center py-8">
                                <span className="loader border-gray-500"></span>
                                <span className="ml-2 text-gray-500">Cargando jornadas...</span>
                            </div>
                        ) : jornadas.length === 0 ? (
                            <p className="text-center py-4 text-gray-600">
                                No se encontraron jornadas con los filtros aplicados.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="w-full bg-white rounded text-sm">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-3 font-semibold text-gray-800 text-left">Fecha</th>
                                            <th className="p-3 font-semibold text-gray-800 text-left">Operario</th>
                                            <th className="p-3 font-semibold text-gray-800 text-center">Jornada<br />Hora Inicio - Hora Fin</th>
                                            <th className="p-3 font-semibold text-gray-800 text-center">Permisos<br />Hora Inicio - Hora Fin</th>
                                            <th className="p-3 font-semibold text-gray-800 text-left">Tipo Permiso</th>
                                            <th className="p-3 font-semibold text-gray-800 text-left">Observaciones de Permiso</th>
                                            <th className="p-3 font-semibold text-gray-800 text-left">Tiempo Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jornadas.map((jornada, index) => (
                                            <JornadaRow
                                                key={jornada._id}
                                                jornada={jornada}
                                                index={index}
                                                onViewDetails={handleViewDetails}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}


                        {/* Paginación */}
                        {pagination.totalPages > 1 && !loading && (
                            <div className="bg-white p-4 shadow-md rounded-b-lg border-t border-gray-200 mt-2 flex justify-center">
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalResults={pagination.totalItems}
                                    itemsPerPage={pagination.itemsPerPage}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}

                    </Card>
                </div>
            </div>

            <style>{`
        .loader {
          border: 4px solid #e0e7ef;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default ConsultaJornadasOptimized;