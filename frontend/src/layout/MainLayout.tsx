// frontend/src/layout/MainLayout.tsx
import React, { Suspense } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PageLoader from '../components/PageLoader';
import { 
  LayoutDashboard,  
  ClipboardList, 
  BarChart2, 
  FileText, 
  LogOut, 
  GraduationCap,
  UserCircle2,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- COMPONENTE MENU ITEM MEJORADO ---
  const MenuItem = ({ 
    label, 
    path, 
    icon: Icon, 
    onClick 
  }: { 
    label: string, 
    path?: string, 
    icon: any, 
    onClick?: () => void 
  }) => {
    // Compara la ruta actual con el path del botón
    const isActive = path ? location.pathname === path : false;
    
    return (
      <li
        onClick={onClick || (() => path && navigate(path))}
        className={`
          group/item relative flex items-center h-12 px-3 my-1.5 rounded-xl cursor-pointer transition-all duration-200
          ${isActive 
            // ESTADO ACTIVO: Fondo blanco, texto azul. Sin bordes que empujen.
            ? 'bg-white text-unach-blue shadow-md font-bold' 
            // ESTADO INACTIVO: Transparente, texto claro.
            : 'text-blue-100 hover:bg-white/10 hover:text-white'
          }
        `}
      >
        {/* Ícono: Si está activo, se pone ROJO para resaltar sobre el blanco */}
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center transition-colors ${isActive ? 'text-unach-red' : ''}`}>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
        </div>

        {/* Texto (se revela al expandir) */}
        <span className={`
          ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 opacity-0 w-0
          group-hover:opacity-100 group-hover:w-auto
        `}>
          {label}
        </span>

        {/* Tooltip para cuando está colapsado */}
        <div className="
          absolute left-full top-1/2 -translate-y-1/2 ml-4 px-2 py-1 
          bg-unach-blue text-white text-xs rounded shadow-lg opacity-0 pointer-events-none
          group-hover/item:opacity-100 md:group-hover:opacity-0 z-50 whitespace-nowrap
        ">
          {label}
        </div>
      </li>
    );
  };

  // Función para obtener la ruta exacta del Dashboard según el rol
  const getDashboardPath = () => {
      if (user?.rol === 'estudiante') return '/dashboard/estudiante';
      if (user?.rol === 'tutor') return '/dashboard/tutor';
      return '/'; // Por defecto
  };

  return (
    <div className="
      group flex flex-col justify-between h-screen bg-unach-blue text-white shadow-2xl z-50
      w-20 hover:w-72 transition-all duration-500 ease-in-out overflow-hidden
    ">
      
      {/* 1. HEADER (Logo e Info) */}
      <div className="p-4">
        <div className="flex items-center gap-3 mb-10 px-1">
            {/* Logo "U" siempre visible */}
            <div className="w-10 h-10 min-w-[2.5rem] bg-white rounded-xl flex items-center justify-center text-unach-blue font-extrabold text-xl shadow-md">
                U
            </div>
            
            {/* Texto UNACH */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
                <h2 className="text-lg font-bold leading-none">Tutorías</h2>
                <p className="text-[10px] text-blue-200 tracking-[0.2em] mt-1">UNACH</p>
            </div>
        </div>

        {/* Perfil de Usuario */}
        {user && (
            <div className="flex items-center gap-3 mb-8 px-1 py-2 rounded-lg bg-blue-900/30 border border-white/5 group-hover:border-white/10 transition-colors">
                <div className="min-w-[2.5rem] flex justify-center">
                    <div className="p-1.5 bg-blue-800 rounded-full">
                        <UserCircle2 size={20} className="text-blue-200" />
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 w-0 group-hover:w-auto overflow-hidden whitespace-nowrap">
                    <p className="font-bold text-sm text-white truncate">{user.nombre.split(' ')[0]}</p>
                    <p className="text-[10px] text-blue-300 uppercase tracking-wide">{user.rol}</p>
                </div>
            </div>
        )}

        {/* NAVEGACIÓN */}
        <nav>
          <ul>
            {/* Dashboard General (Ahora apunta a la ruta específica) */}
            {user?.rol !== 'coordinador' && (
                <MenuItem 
                    label="Dashboard" 
                    path={getDashboardPath()} 
                    icon={LayoutDashboard} 
                />
            )}

            {/* Estudiante */}
            {user?.rol === 'estudiante' && (
                <MenuItem 
                    label="Mis Tutorías" 
                    path="/tutorias/estudiante" 
                    icon={GraduationCap}
                />
            )}
            
            {/* Tutor */}
            {user?.rol === 'tutor' && (
                <MenuItem 
                    label="Gestión Tutorías" 
                    path="/tutorias/tutor" 
                    icon={ClipboardList}
                />
            )}
            
            {/* Coordinador */}
            {user?.rol === 'coordinador' && (
                <>
                    <MenuItem 
                        label="Cuadro de Mando" 
                        path="/dashboard/coordinador" 
                        icon={BarChart2}
                    />
                    <MenuItem 
                        label="Reportes" 
                        path="/reportes/coordinador" 
                        icon={FileText}
                    />
                </>
            )}
          </ul>
        </nav>
      </div>

      {/* 2. FOOTER (Logout) */}
      <div className="p-4 border-t border-white/10 bg-blue-950/20">
        <button
          onClick={handleLogout}
          className="
            flex items-center w-full px-2 py-3 rounded-xl text-red-200 hover:bg-unach-red hover:text-white transition-all duration-200
            group/logout
          "
        >
          <div className="min-w-[2.5rem] flex justify-center">
            <LogOut size={20} />
          </div>
          <span className="ml-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap overflow-hidden">
            Cerrar Sesión
          </span>
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar fijo a la izquierda */}
      <Sidebar />
      
      {/* Contenido principal */}
      <main className="flex-1 h-full overflow-y-auto relative scroll-smooth">
        {/* Fondo decorativo superior para dar profundidad */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-blue-50 to-transparent -z-10" />
        
        <div className="p-8 max-w-7xl mx-auto min-h-screen"> {/* Agregué min-h-screen para asegurar altura */}
            
            {/* --- AQUÍ ESTÁ EL CAMBIO CLAVE --- */}
            {/* Envolvemos el Outlet en Suspense. */}
            {/* Esto hace que SOLO esta parte muestre el loader al cambiar de ruta, */}
            {/* mientras el Sidebar sigue visible y clicable. */}
            <Suspense fallback={<PageLoader />}>
                <Outlet /> 
            </Suspense>
            {/* --------------------------------- */}

        </div>
      </main>
    </div>
  );
};

export default MainLayout;