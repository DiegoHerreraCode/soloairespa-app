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
    <header className="h-16 px-4 md:px-6 bg-card border-b border-border flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Lado izquierdo: Botón Sidebar + Logo + Botón Modo Oscuro/Claro */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <CustomLogo subtitle="Admin" />

        <button
          onClick={toggleTheme}
          aria-label="Alternar modo claro / oscuro"
          title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer ml-1"
        >
          {theme === 'dark' ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
        </button>
      </div>

      {/* Lado derecho: Saludo al admin + Botón Cerrar Sesión */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
          Hola, <strong className="text-foreground">{user?.name || 'Administrador'}</strong>
        </span>

        <Button
          onClick={logout}
          variant="destructive"
          size="sm"
          className="flex items-center gap-1.5 shadow-sm"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
};
