import { Sun, Moon, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '@/auth/store/auth.store';
import { useThemeStore } from '@/lib/theme.store';
import { CustomLogo } from '@/components/custom/CustomLogo';
import { Button } from '@/components/ui/button';

interface Props {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const AdminHeader = ({ isSidebarOpen, onToggleSidebar }: Props) => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 px-4 md:px-6 bg-card/90 backdrop-blur-md border-b border-border/80 flex items-center justify-between sticky top-0 z-30 transition-colors shadow-xs">
      {/* Lado izquierdo: Botón Sidebar + Logo con Imagen + Botón Modo Oscuro/Claro */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        {/* Logo de la empresa usando SOLO_AIRE_LOGO.png */}
        <CustomLogo subtitle="Admin" size="sm" />

        <button
          onClick={toggleTheme}
          aria-label="Alternar modo claro / oscuro"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-all duration-200 active:scale-95 cursor-pointer ml-1"
        >
          {theme === 'dark' ? (
            <Sun size={19} className="text-amber-400 animate-in spin-in-180 duration-300" />
          ) : (
            <Moon size={19} className="text-slate-600 animate-in spin-in-180 duration-300" />
          )}
        </button>
      </div>

      {/* Lado derecho: Saludo al admin + Botón Cerrar Sesión */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-muted-foreground">Sesión iniciada</span>
          <span className="text-sm font-semibold text-foreground leading-tight">
            {user?.name || 'Administrador'}
          </span>
        </div>

        <Button
          onClick={logout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-1.5 shadow-sm rounded-xl px-3.5"
        >
          <LogOut size={15} />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
};
