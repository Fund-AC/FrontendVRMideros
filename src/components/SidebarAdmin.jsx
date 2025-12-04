import React, { useState, useEffect } from "react";
import { Calendar, User, Cpu, LayoutDashboard, Settings, Home, HardHat, ShoppingCart, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom";
import {motion} from "framer-motion";
import logo from '../assets/2.png'; 

export const SidebarAdmin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed") === "true";
    setCollapsed(saved);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

    const toggleSidebar = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", newState);
  };

    const menuItems = [
  { to: "/admin-home", icon: Home, label: "Dashboard" },
  { to: "/admin-dashboard", icon: LayoutDashboard, label: "Consulta de Producción" },
  { to: "/admin/jornadas", icon: Calendar, label: "Consulta de Jornadas" },
  { to: "/admin/usuarios", icon: User, label: "Usuarios" },
  { to: "/admin/maquinas", icon: Cpu, label: "Máquinas" },
  { to: "/admin/areas", icon: LayoutDashboard, label: "Áreas de Producción" },
  { to: "/admin/procesos", icon: Settings, label: "Procesos" },
  { to: "/admin/insumos", icon: ShoppingCart, label: "Insumos" },
  { to: "/admin/operarios", icon: HardHat, label: "Operarios" },
];

  return (
    <motion.div
      className={`h-full bg-gray-800 text-white shadow-md transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      } flex flex-col`}
      initial={{ width: collapsed ? 64 : 256 }} // Establecer el tamaño inicial
      animate={{ width: collapsed ? 64 : 256 }} // Animar el cambio de tamaño
      transition={{ duration: 0.1 }} // Duración de la animación
    >
      {/* Logo and Toggle Button */}
                        <div className={`flex items-center p-4 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <img src={logo} alt="Logo" className="h-30 w-auto" /> // Mostrar logo cuando no está colapsado
        )}
        <button
          onClick={toggleSidebar}
          className="text-white focus:outline-none"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        {menuItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-2 p-2 rounded-md ${
              location.pathname.startsWith(to)
                ? "bg-gray-700"
                : "hover:bg-gray-700"
            }`}
          >
            <Icon className="text-white" size={20} />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
      </nav>

      {/* Logout */}
                         <div className="mt-auto p-2 pb-4 border-t border-gray-700"> {/* Cambié p-2 por p-2 pb-4 */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 p-2 hover:bg-gray-700 rounded-md w-full text-red-400 hover:text-red-300"
        aria-label="Salir"
      >
        <LogOut className="text-red-400" size={20} />
        {!collapsed && <span>Cerrar Sesión</span>}
       </button>
      </div>
     </motion.div>
  );
};
