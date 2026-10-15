import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomLogo } from '@/components/custom/CustomLogo';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import { useAuthStore } from '@/auth/store/auth.store';
import soloAireLogoDark from '@/assets/SOLO_AIRE_LOGO_DARK_THEME.png';
import { Eye, EyeOff } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

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
      <Card className="overflow-hidden p-0 shadow-xl border-border/80 rounded-2xl bg-card">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-10 flex flex-col justify-center" onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center gap-2">
                <CustomLogo subtitle="Ingreso" size="lg" />
                <p className="text-balance text-sm text-muted-foreground mt-1">
                  Ingrese sus credenciales para acceder al sistema
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="usuario@soloairespa.cl"
                  className="rounded-xl h-11 px-3.5 focus-visible:ring-primary/40"
                  required
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                  <Link
                    to="/auth/forgot-password"
                    className="ml-auto text-xs font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'password' : 'text'}
                  name="password"
                  placeholder="••••••••"
                  className="rounded-xl h-11 px-3.5 focus-visible:ring-primary/40"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold transition-all duration-200"
                disabled={isPosting}
              >
                {isPosting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{' '}
                <Link
                  to="/auth/register"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                >
                  Regístrate
                </Link>
              </div>
            </div>
          </form>

          {/* Banner lateral derecho con degradado e imagen del logo */}
          <div className="relative hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 md:flex md:flex-col md:justify-center md:items-center text-white p-10 text-center border-l border-border/20">
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 mb-6 shadow-lg">
                <img
                  src={soloAireLogoDark}
                  alt="SoloAireSPA"
                  className="h-24 w-auto object-contain drop-shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">SoloAireSPA</h2>
              <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
                Sistema centralizado para climatización, órdenes técnicas, inventarios y cotizaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
