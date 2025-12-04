import React, { useState, useRef } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';
import { IdCard } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/2.png';

const ValidateCedula = () => {
  const [cedula, setCedula] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);

  const handleLogout = () => {
    // Eliminar todos los datos relevantes del almacenamiento local
    localStorage.clear();
    navigate('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Evitar envíos múltiples
    if (loading) return;
    
    // Debouncing: cancelar solicitud anterior si existe
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setMessage('');
    setLoading(true);

    // Agregar pequeño delay para evitar múltiples solicitudes
    debounceRef.current = setTimeout(async () => {
      try {
        const storedToken = localStorage.getItem('token');
        const config = storedToken ? { headers: { Authorization: `Bearer ${storedToken}` } } : {};

        const response = await axiosInstance.post('/operarios/validate-cedula', { cedula }, config);
        const { operario, token } = response.data;

        if (!operario || (!operario.id && !operario._id)) {
          setMessage('Datos del operario incompletos');
          return;
        }

        localStorage.setItem('operario', JSON.stringify({
          _id: operario._id || operario.id,
          name: operario.name,
          cedula: operario.cedula
        }));

        if (token) {
          localStorage.setItem('token', token);
        }

        setTimeout(() => {
          navigate('/operario-dashboard');
        }, 500);        } catch (error) {
        console.error('Error al validar cédula:', error);
        
        // Manejo específico para error 429
        if (error.response?.status === 429) {
          const retryAfter = error.response?.data?.retryAfter || '15 minutos';
          setMessage(`Demasiadas solicitudes. Intenta nuevamente en ${retryAfter}.`);
        } else if (error.message?.includes('Rate limit')) {
          setMessage('Demasiadas solicitudes. Por favor espera un momento antes de intentar nuevamente.');
        } else if (error.response?.status === 404) {
          setMessage('Cédula no encontrada en el sistema');
        } else if (error.response?.status === 400) {
          setMessage('Cédula inválida. Verifica el número ingresado.');
        } else if (error.response?.status === 403) {
          setMessage(error.response?.data?.message || 'Acceso denegado: Operario inactivo');
        } else {
          setMessage('Error al validar cédula. Intenta nuevamente.');
        }
      } finally {
        setLoading(false);
      }
    }, 300); // Esperar 300ms antes de enviar
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* Lado izquierdo con logo */}
      <div className="hidden md:flex w-1/2 items-center justify-center p-10">
        <img src={logo} alt="Logo Mideros" className="w-3/4 max-w-sm animate-fade-in" />
      </div>

      {/* Botón de cerrar sesión */}
      <div className="absolute top-4 right-4">
        <button
          onClick={handleLogout}
          className="order-1 sm:order-2 bg-gradient-to-r from-red-400 to-red-600  text-white font-semibold py-2 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto transform hover:scale-105"
          //  className="order-1 sm:order-2 bg-gradient-to-r from-red-400 to-red-600  text-white font-semibold px-6 sm:px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 text-sm sm:text-base w-full sm:w-auto transform hover:scale-105"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Formulario */}
      <div className="flex w-full md:w-1/2 justify-center items-center px-6 md:px-16">
        <motion.form
          onSubmit={handleSubmit}
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl font-bold text-center mb-6 text-white">Identificación</h1>

          <div className="relative mb-6">
            <IdCard className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Ingrese su cédula"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-2 rounded-lg transition duration-200 flex justify-center"
          >
            {loading ? 'Validando...' : 'Validar Cédula'}
          </button>

          {message && (
            <p className={`mt-4 text-sm text-center ${
              message.includes('Demasiadas') ? 'text-yellow-500' : 'text-red-500'
            }`}>
              {message}
            </p>
          )}
        </motion.form>
      </div>
    </div>
  );
};

export default ValidateCedula;