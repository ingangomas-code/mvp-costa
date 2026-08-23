import React, { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { NotificationCenter } from "./NotificationCenter";

export function TopBar({ role, onToggleMobileMenu }: { role: string; onToggleMobileMenu?: () => void }) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }
    setSearchParams(newParams);
  };
  
  const getRoleInfo = () => {
    switch (role) {
      case 'propietario': return { title: 'Portal Propietario', displayRole: 'Propietario', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCatKvn5lAKx3QgYeqsY-EtOg0efyZfyE1K0RnRSgk5M4L3rXua07G968z0xG0zqpHX2KIIEmJs6JOwuw2hk-lSaP1FpFavtgTpAtB51UNvkytYZYVccPu9ttVEql1NC2q38WIKHETFCTzd3yV90MRlg2Bzm_xP78ykrPaWf5cc8v6T9TZuRhiRtwpsAsbVtPMLMMH0H0pupyztHu6BvcuFTXQQDEl_D6V26IaOId4uZMSHnVhHW_MS' };
      case 'arquitecto': return { title: 'Portal Arquitecto', displayRole: 'Arquitecto', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCatKvn5lAKx3QgYeqsY-EtOg0efyZfyE1K0RnRSgk5M4L3rXua07G968z0xG0zqpHX2KIIEmJs6JOwuw2hk-lSaP1FpFavtgTpAtB51UNvkytYZYVccPu9ttVEql1NC2q38WIKHETFCTzd3yV90MRlg2Bzm_xP78ykrPaWf5cc8v6T9TZuRhiRtwpsAsbVtPMLMMH0H0pupyztHu6BvcuFTXQQDEl_D6V26IaOId4uZMSHnVhHW_MS' };
      case 'contratista': return { title: 'Portal Contratista', displayRole: 'Contratista', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj72r4YsI323w-356f9N1W6xyFyJdX6c6-zLQNRGrXXgTmW3QWdTx9RxyPiYMaMi1S5FFctr-SEMLXjmxSvGRSc7eQ8e_tegnTDelacB3acCtnK--u7YE9UV_G86S8HpYomgYAoUv8MVQjxUP_QcST9xAvTzfH51_tiDZNzz-cBSCSEVTiEJeQZUl6L8UKGLuOHtMa4pRF7k-H9fQGGq2S0w4xPP8xDNu6a-6Qqo4n2czx_YvM0Rnt' };
      case 'revision-tecnica': return { title: 'Revisión Técnica', displayRole: 'Revisor técnico', img: '' };
      case 'control-obras': return { title: 'Control de Obras', displayRole: 'Inspector (Control)', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBj72r4YsI323w-356f9N1W6xyFyJdX6c6-zLQNRGrXXgTmW3QWdTx9RxyPiYMaMi1S5FFctr-SEMLXjmxSvGRSc7eQ8e_tegnTDelacB3acCtnK--u7YE9UV_G86S8HpYomgYAoUv8MVQjxUP_QcST9xAvTzfH51_tiDZNzz-cBSCSEVTiEJeQZUl6L8UKGLuOHtMa4pRF7k-H9fQGGq2S0w4xPP8xDNu6a-6Qqo4n2czx_YvM0Rnt' };
      case 'legal': return { title: 'Depto. Legal', displayRole: 'Revisor Legal', img: '' };
      case 'electrica': return { title: 'Ing. Eléctrica', displayRole: 'Ing. Eléctrico', img: '' };
      case 'hidrosanitaria': return { title: 'Ing. Hidrosanitaria', displayRole: 'Ing. Hidrosanitario', img: '' };
      case 'paisajismo': return { title: 'Paisajismo', displayRole: 'Paisajista', img: '' };
      case 'mensura': return { title: 'Mensura', displayRole: 'Revisor de mensura', img: '' };
      case 'seguridad': return { title: 'Seguridad', displayRole: 'Control de seguridad', img: '' };
      case 'admin': return { title: 'Administración', displayRole: 'Administrador General', img: '' };
      default: return { title: 'Costasur CDE', displayRole: 'Usuario', img: '' };
    }
  };

  const { title, displayRole, img } = getRoleInfo();

  return (
    <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-sm flex flex-col justify-center px-4 md:px-10 py-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleMobileMenu} 
            className="md:hidden text-primary p-2 -ml-2 rounded-xl hover:bg-surface-variant flex items-center justify-center"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
          
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-primary tracking-tight truncate max-w-[200px] sm:max-w-none">
              {title}
            </h2>
            <p className="text-[11px] text-secondary md:hidden truncate">
              {displayRole}
            </p>
          </div>

          {role === 'revision-tecnica' && (
            <div className="hidden lg:flex items-center gap-2 text-secondary text-sm ml-4 border-l border-outline-variant/50 pl-4">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>Trabajo en Progreso</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span className="text-primary font-medium">Compartido</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
              <span>Publicado</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile search toggle */}
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)} 
            className="lg:hidden text-secondary hover:text-primary p-2 rounded-full hover:bg-surface-variant"
            aria-label="Buscar"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </button>

          {/* Desktop search */}
          <div className="hidden lg:flex items-center bg-surface-container-low rounded-full px-4 py-1.5 border border-outline-variant/20 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-secondary mr-2 text-[18px]">search</span>
            <input 
              className="bg-transparent border-none outline-none text-sm w-48 xl:w-64 placeholder:text-secondary focus:ring-0" 
              placeholder="Buscar por nombre, código..." 
              type="text"
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          <div className="hidden md:block text-xs md:text-sm text-secondary">
            Usuario: <span className="font-medium text-primary">{displayRole}</span>
          </div>

          <NotificationCenter />

          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-surface-variant overflow-hidden border border-outline-variant/30 flex items-center justify-center text-secondary shrink-0">
            {img ? (
              <img alt="User Profile" src={img} className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-[20px]">person</span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Mobile Search Bar */}
      {showMobileSearch && (
        <div className="mt-3 lg:hidden flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/30">
          <span className="material-symbols-outlined text-secondary mr-2 text-[18px]">search</span>
          <input 
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-secondary focus:ring-0" 
            placeholder="Buscar por nombre, código, contratista..." 
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchParams({})} className="text-secondary p-1">
              <span className="material-symbols-outlined text-[16px]">clear</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
}
