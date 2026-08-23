import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { signIn, isConfigured, isAuthenticated, primaryRole } = useSession();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !primaryRole) return;
    const destinations: Record<string, string> = {
      admin_general: "/admin", propietario: "/propietario/mis-propiedades",
      arquitecto: "/arquitecto/mis-proyectos", contratista: "/contratista/obras-activas",
      revision_tecnica: "/revision-tecnica", control_obras: "/control-obras",
      legal: "/legal", electrica: "/electrica", hidrosanitaria: "/hidrosanitaria",
      paisajismo: "/paisajismo", mensura: "/mensura", seguridad: "/seguridad",
    };
    navigate(destinations[primaryRole] ?? "/propietario/mis-propiedades", { replace: true });
  }, [isAuthenticated, primaryRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    if (!isConfigured) {
      setErrorMessage("La conexión con Costasur todavía no está configurada en este entorno.");
      return;
    }
    setIsSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setIsSubmitting(false);
    if (error) setErrorMessage(error.message || "No fue posible iniciar sesión.");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar corporativo Costasur adaptado al CDE */}
      <header className="costasur-header">
        <div className="costasur-nav-container">
          <a href="#" className="costasur-logo-link" aria-label="Costasur Casa de Campo">
            <img src="/costasur-logo.svg" alt="Costasur Casa de Campo" className="costasur-logo-svg" />
          </a>
          <button type="button" className="costasur-menu-button md:hidden" aria-label="Abrir menú" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
          </button>
          <nav className={`${menuOpen ? "flex" : "hidden"} md:flex costasur-nav-links`} aria-label="Navegación principal del CDE">
            <a href="#normativas" onClick={() => setMenuOpen(false)}>NORMATIVAS</a>
            <a href="#formularios" onClick={() => setMenuOpen(false)}>FORMULARIOS</a>
            <a href="#carta-inicio" onClick={() => setMenuOpen(false)}>CARTA DE INICIO</a>
            <a href="#contactos" onClick={() => setMenuOpen(false)}>CONTACTOS</a>
          </nav>
          <div className="costasur-nav-actions">
            <button type="button" className="costasur-icon-button" aria-label="Buscar"><span className="material-symbols-outlined">search</span></button>
            <a href="#cde-login" className="costasur-owner-link">ACCESO PROPIETARIOS</a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Image Section */}
        <div 
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2000&auto=format&fit=crop')` }}
        >
        </div>

        {/* Right Login Form Section */}
        <div id="cde-login" className="w-full md:w-1/2 flex items-center justify-center p-8 bg-surface">
          <div className="bg-white rounded-[2rem] p-8 md:p-12 max-w-md w-full shadow-lg border border-outline-variant/10">
            
            {/* Logo & Header */}
            <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                <div className="w-44 h-16 flex items-center justify-center">
                  <img src="/costasur-logo-dark.svg" alt="Costasur Casa de Campo" className="w-full h-full object-contain" />
                </div>
              </div>
              <p className="text-secondary mt-2 font-medium">Common Data Environment</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {errorMessage && (
                <div className="rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">{errorMessage}</div>
              )}
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Usuario / Correo Electrónico
                </label>
                <input 
                  type="text" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-[#003B70] focus:border-[#003B70] transition-all outline-none"
                  placeholder="ej. arquitecto@demo.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-secondary uppercase tracking-wider mb-2">
                  Contraseña
                </label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white border border-outline-variant/50 rounded-xl py-3 px-4 text-on-surface focus:ring-2 focus:ring-[#003B70] focus:border-[#003B70] transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting} className="w-full py-4 px-6 rounded-full bg-[#4A5056] text-white font-bold hover:bg-[#4A5056] transition-all shadow-md mt-4 flex items-center justify-center gap-2"
              >
                Iniciar Sesión
                <span className="material-symbols-outlined text-[20px]">login</span>
              </button>
            </form>

            {/* Helper Note for Prototype Navigation */}
            <div className="mt-10 pt-6 border-t border-outline-variant/20">
              <p className="text-xs text-[#4A5056] text-center leading-relaxed">
                *Info Demo: Para probar los distintos perfiles, ingrese como usuario uno de los siguientes: <br/>
                <span className="font-semibold text-[#4A5056]">admin, propietario, arquitecto, contratista, revisión técnica, control de obras, legal, eléctrica, hidrosanitaria, paisajismo, mensura y seguridad</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-[#333333] py-6 px-6 flex flex-col md:flex-row items-center justify-center border-t border-[#444444] gap-8">
        <div className="text-white flex flex-col text-center md:text-right">
          <div className="flex flex-col md:flex-row md:items-baseline md:justify-end gap-1 md:gap-2">
            <span className="text-sm md:text-base font-light tracking-wide uppercase">Proceso de</span>
            <span className="text-lg md:text-xl font-bold tracking-wide uppercase mt-1 md:mt-0">Registro de Obras</span>
          </div>
          <span className="text-sm md:text-base font-light tracking-wide uppercase mt-1">En Nuestra Comunidad</span>
        </div>

        <div className="hidden md:block h-12 w-px bg-white/30"></div>

        <div className="flex items-center gap-3">
          <img src="/costasur-logo.svg" alt="Costasur Casa de Campo" className="h-10 w-auto" />
        </div>
      </div>
      
      {/* Powered By */}
      <div className="bg-[#333333] py-3 text-center">
        <p className="text-xs text-white/65 font-medium tracking-wide">Powered by Dominican AI Studio</p>
      </div>
    </div>
  );
}

