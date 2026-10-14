import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomLogo } from '@/components/custom/CustomLogo';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuthStore } from '@/auth/store/auth.store';

export const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [isPosting, setIsPosting] = useState<boolean>(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPosting(true);

    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const result = await login(email, password);

    if (result.ok) {
      toast.success(result.message || 'Login exitoso');
      navigate('/');
      return;
    }

    toast.error(result.message || 'Email o contraseña incorrectos');
    setIsPosting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 shadow-lg border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-1">
                <CustomLogo subtitle="Ingreso" />
                <p className="text-balance text-sm text-muted-foreground">
                  Ingrese a nuestra aplicación
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="usuario@soloairespa.cl"
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Contraseña</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="ml-auto text-sm text-primary hover:underline underline-offset-4"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isPosting}>
                {isPosting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <div className="text-center text-sm">
                ¿No tienes una cuenta?{' '}
                <Link to="/auth/register" className="font-semibold text-primary underline underline-offset-4">
                  Regístrate
                </Link>
              </div>
            </div>
          </form>

          <div className="relative hidden bg-slate-900 md:flex md:flex-col md:justify-center md:items-center text-white p-8">
            <h2 className="text-2xl font-bold mb-2">Solo Aire SpA</h2>
            <p className="text-sm text-slate-300 text-center">
              Gestión centralizada de climatización, órdenes y servicios técnicos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
