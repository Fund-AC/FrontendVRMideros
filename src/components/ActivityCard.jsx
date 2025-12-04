// src/components/ActivityCard.jsx
import React, { useState, useEffect } from 'react';
import { Hammer, Eye, Pencil } from 'lucide-react';
import { Button } from './ui/index';
import { motion } from 'framer-motion';
import { formatTime, getStateColors } from '../utils/helpers';

const ActivityCard = ({ actividad, onVerDetalle, onEditarActividad }) => {
    const [progress, setProgress] = useState(0);
    const [displayState, setDisplayState] = useState('Pendiente');
    const [displayFinTime, setDisplayFinTime] = useState('--:--');
    // Nuevo estado para almacenar el tiempo transcurrido, si lo necesitamos en el JSX
    const [elapsedMinutes, setElapsedMinutes] = useState(0);

    const tiempoEstimadoEnMinutos = actividad.tiempoEstimado || actividad.tiempo || 60;

    useEffect(() => {
        let interval = null;

        const calculateActivityStatus = () => {
            const inicioMs = actividad.horaInicio ? new Date(actividad.horaInicio).getTime() : 0;
            const ahoraMs = new Date().getTime(); // Se define aquí

            let currentProgress = 0;
            let currentDisplayState = 'Pendiente';
            let currentDisplayFinTime = '--:--';
            let currentElapsedMinutes = 0; // Para el nuevo estado

            if (inicioMs === 0) {
                currentProgress = 0;
                currentDisplayState = 'Pendiente';
                currentDisplayFinTime = 'Pendiente';
                currentElapsedMinutes = 0;
            } else {
                const finRealOEstimadoMs = actividad.horaFin
                    ? new Date(actividad.horaFin).getTime()
                    : inicioMs + (tiempoEstimadoEnMinutos * 60 * 1000);

                const totalDurationMs = finRealOEstimadoMs - inicioMs;
                const elapsedDurationMs = ahoraMs - inicioMs;

                if (totalDurationMs <= 0) {
                    currentProgress = 0;
                    currentDisplayState = 'Pendiente';
                    currentDisplayFinTime = 'Inválido';
                    currentElapsedMinutes = 0;
                } else if (ahoraMs >= finRealOEstimadoMs) {
                    currentProgress = 100;
                    currentDisplayState = 'Finalizado';
                    currentDisplayFinTime = formatTime(new Date(finRealOEstimadoMs).toISOString());
                    currentElapsedMinutes = Math.round(totalDurationMs / 60000); // Duración total
                } else {
                    currentProgress = (elapsedDurationMs / totalDurationMs) * 100;
                    currentProgress = Math.min(100, Math.max(0, currentProgress));
                    currentDisplayState = 'En progreso';
                    currentDisplayFinTime = 'En curso...';
                    currentElapsedMinutes = Math.round(elapsedDurationMs / 60000); // Tiempo transcurrido
                }
            }

            setProgress(currentProgress);
            setDisplayState(currentDisplayState);
            setDisplayFinTime(currentDisplayFinTime);
            setElapsedMinutes(currentElapsedMinutes); // Actualiza el nuevo estado
        };

        calculateActivityStatus();
        if (displayState !== 'Finalizado') {
             interval = setInterval(calculateActivityStatus, 1000);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [actividad._id, actividad.horaInicio, actividad.horaFin, tiempoEstimadoEnMinutos, displayState]);

    // Calcular inicioMs fuera del useEffect para que sea accesible en el JSX
    const inicioMs = actividad.horaInicio ? new Date(actividad.horaInicio).getTime() : 0;

    return (
        <motion.div
            key={actividad._id}
            className="bg-white px-4 pt-4 rounded-xl border border-gray-300 flex flex-col justify-between shadow-sm relative overflow-hidden"
            whileHover={{ scale: 1.01 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* Contenido principal de la tarjeta */}
                        <div className="relative z-10 flex items-center gap-3 mb-3">
                <Hammer className="w-6 h-6 text-blue-600" aria-label="Actividad" />
                <div className="flex-1">
                    <h4 className="font-medium text-black text-lg">
                        {actividad.procesos && Array.isArray(actividad.procesos) && actividad.procesos.length > 0 ? actividad.procesos.map(p => p.nombre).join(', ') : actividad.proceso?.nombre || 'N/A'}</h4>
                    <p className="text-sm text-gray-900">OTI: {actividad.oti?.numeroOti || actividad.oti || 'N/A'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStateColors(displayState)}`}>
                    {displayState}
                </span>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-2 text-sm text-gray-900 mb-4">
                        <div>
                    <span className="font-semibold block text-black">Inicio</span>
                    {formatTime(actividad.horaInicio)}
                </div>
                <div className="text-right">
                    <span className="font-semibold block text-black">Fin</span>
                    {displayFinTime}
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-center text-sm text-gray-500 pb-4">
                <div className="flex items-center gap-1">
                    <span className="font-medium">
                        {/* Ahora usamos elapsedMinutes del estado */}
                        {displayState === 'Finalizado'
                            ? `${elapsedMinutes} min` // Muestra duración total al finalizar
                            : (displayState === 'En progreso'
                                ? `${elapsedMinutes} min transcurridos` // Muestra transcurridos
                                : 'N/A min')}
                    </span>
                    {displayState === 'En progreso' && tiempoEstimadoEnMinutos > 0 &&
                        <span className="text-xs text-gray-400"> (Est. {tiempoEstimadoEnMinutos} min)</span>}
                </div>
            </div>

            {/* BARRA DE PROGRESO INFERIOR */}
                        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gray-200 rounded-b-xl overflow-hidden">
                <div
                    className="h-full"
                    style={{
                        width: `${progress}%`,
                        backgroundColor: progress >= 100 ? '#22C55E' : '#3B82F6'
                    }}
                ></div>
            </div>
        </motion.div>
    );
};

export default ActivityCard;