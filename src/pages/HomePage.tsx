import { useAuthStore } from '@/auth/store/auth.store';
import { Button } from '@/components/ui/button';

export const HomePage = () => {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center space-y-4 border">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center font-bold text-xl">
          SA
        </div>
        <h1 className="text-2xl font-bold text-slate-900">¡Bienvenido a Solo Aire SpA!</h1>
        <p className="text-sm text-slate-500">
          Has iniciado sesión correctamente en el sistema.
        </p>

        {user && (
          <div className="bg-slate-100 p-3 rounded-lg text-left text-sm space-y-1">
            <p><strong className="text-slate-700">Nombre:</strong> {user.name}</p>
            <p><strong className="text-slate-700">Email:</strong> {user.email}</p>
          </div>
        )}

        <Button onClick={logout} variant="destructive" className="w-full">
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};
