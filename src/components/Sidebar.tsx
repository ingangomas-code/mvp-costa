import { Link, useLocation } from "react-router-dom";

export function Sidebar({ 
  role, 
  isMobileOpen, 
  onCloseMobileMenu,
  onSignOut,
}: { 
  role: string; 
  isMobileOpen?: boolean; 
  onCloseMobileMenu?: () => void;
  onSignOut?: () => Promise<void>;
}) {
  const location = useLocation();
  const path = location.pathname;

  const getNavClass = (isActive: boolean) => 
    isActive
      ? "bg-white text-primary border-l-4 border-primary px-6 py-3 flex items-center gap-4 transition-all duration-200"
      : "text-secondary hover:text-primary px-6 py-3 flex items-center gap-4 hover:bg-secondary-container/30 transition-all duration-200";

  let links: { to: string; icon: string; label: string }[] = [];

  switch (role) {
    case 'propietario':
      links = [
        { to: "/propietario/mis-propiedades", icon: "domain", label: "Mis Propiedades" },
      ];
      break;
    case 'arquitecto':
      links = [
        { to: "/arquitecto/mis-proyectos", icon: "architecture", label: "Mis Proyectos" },
        { to: "/arquitecto", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'contratista':
      links = [
        { to: "/contratista/obras-activas", icon: "construction", label: "Obras Activas" },
        { to: "/contratista", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'revision-tecnica':
      links = [
        { to: "/revision-tecnica/revision", icon: "fact_check", label: "Revisión General" },
        { to: "/revision-tecnica/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/revision-tecnica", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'control-obras':
      links = [
        { to: "/control-obras/control", icon: "construction", label: "Control de Obras General" },
        { to: "/control-obras/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/control-obras", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'legal':
      links = [
        { to: "/legal/validaciones", icon: "gavel", label: "Validaciones Legales" },
        { to: "/legal/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/legal", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'electrica':
      links = [
        { to: "/electrica/revision", icon: "electrical_services", label: "Revisión Eléctrica" },
        { to: "/electrica/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/electrica", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'hidrosanitaria':
      links = [
        { to: "/hidrosanitaria/revision", icon: "plumbing", label: "Revisión Hidrosanitaria" },
        { to: "/hidrosanitaria/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/hidrosanitaria", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'paisajismo':
      links = [
        { to: "/paisajismo/revision", icon: "park", label: "Revisión Paisajismo" },
        { to: "/paisajismo/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/paisajismo", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'mensura':
      links = [
        { to: "/mensura/revision", icon: "straighten", label: "Revisión de Mensura" },
        { to: "/mensura/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/mensura", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'seguridad':
      links = [
        { to: "/seguridad/revision", icon: "security", label: "Control de Seguridad" },
        { to: "/seguridad/proyectos", icon: "folder_open", label: "Proyectos" },
        { to: "/seguridad", icon: "dashboard", label: "Dashboard" },
      ];
      break;
    case 'admin':
      links = [
        { to: "/admin/mapa", icon: "admin_panel_settings", label: "Admin General" },
        { to: "/admin/proyectos", icon: "folder_open", label: "Proyectos Generales" },
        { to: "/admin/departamentos", icon: "corporate_fare", label: "Control Departamentos" },
        { to: "/admin/dashboard", icon: "dashboard", label: "Dashboard General" },
      ];
      break;
  }

  const renderNavContent = (isMobile: boolean = false) => (
    <>
      <div className="px-6 mb-8 flex items-center justify-between">
        <div>
          <div className="bg-[#333333] p-3 rounded-xl inline-block mb-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 60" className="h-7 w-auto">
              <g fill="#ffffff">
                <path d="M 30 10 C 18.95 10 10 18.95 10 30 C 10 32.5 10.46 34.89 11.3 37.1 C 13.5 35.2 16.5 34 20 34 C 25 34 29 36.5 32 39 C 34.5 37 38.5 35 43 35 C 46.5 35 49.2 36.2 51 37.5 C 49.8 22 39.5 10 30 10 Z" opacity="0.95"/>
                <path d="M 12.5 41 C 15 39 18 38 21 38 C 26 38 30 40.5 33 43 C 35.5 41 39.5 39 44 39 C 47.5 39 50 40.5 51.5 42 C 49 48 40 50 30 50 C 21 50 14.5 46 12.5 41 Z"/>
                <text x="65" y="32" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="800" fontSize="22" letterSpacing="2">COSTASUR</text>
                <text x="65" y="46" fontFamily="'Helvetica Neue', Arial, sans-serif" fontWeight="400" fontSize="11" letterSpacing="3">CASA de CAMPO®</text>
              </g>
            </svg>
          </div>
          <p className="text-xs text-secondary font-medium">Oficina de Control de Obras</p>
        </div>

        {isMobile && (
          <button 
            onClick={onCloseMobileMenu}
            className="p-2 rounded-full hover:bg-surface-variant text-secondary"
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <ul className="space-y-2">
          {links.map((link, idx) => (
            <li key={idx}>
              <Link 
                to={link.to} 
                onClick={isMobile ? onCloseMobileMenu : undefined}
                className={getNavClass(path === link.to)}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{link.icon}</span>
                <span className="font-medium text-sm md:text-base">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="px-6 mt-6">
        {role === 'propietario' && (
          <Link
            to="/propietario/mis-propiedades?nuevo=1"
            onClick={isMobile ? onCloseMobileMenu : undefined}
            className="w-full bg-primary-container text-white rounded-full py-3 px-6 flex items-center justify-center gap-2 font-medium hover:bg-primary-container/90 transition-colors shadow-md text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nuevo Proyecto
          </Link>
        )}
        {role === 'arquitecto' && (
          <button type="button" className="w-full bg-primary-container text-white rounded-full py-3 px-6 flex items-center justify-center gap-2 font-medium hover:bg-primary-container/90 transition-colors shadow-md text-sm">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nuevo Proyecto
          </button>
        )}
      </div>

      <div className="mt-6 border-t border-outline-variant/20 pt-4">
        <ul className="space-y-2">
          <li>
            <button
              type="button"
              onClick={() => { void onSignOut?.(); }}
              className={`${getNavClass(false)} w-full text-left`}
            >
              <span className="material-symbols-outlined">logout</span>
              <span className="font-medium text-sm md:text-base">Cerrar Sesión</span>
            </button>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col h-full py-8 fixed left-0 top-0 w-[280px] backdrop-blur-2xl border-r border-outline-variant/20 shadow-xl bg-surface/70 z-40">
        {renderNavContent(false)}
      </nav>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
            onClick={onCloseMobileMenu} 
          />
          
          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-surface py-6 flex flex-col h-full shadow-2xl z-10 overflow-y-auto">
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
