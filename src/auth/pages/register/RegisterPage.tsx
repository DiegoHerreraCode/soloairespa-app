import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomLogo } from '@/components/custom/CustomLogo';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/auth/store/auth.store';
import { toast } from 'sonner';
import { useState } from 'react';
import soloAireLogoDark from '@/assets/SOLO_AIRE_LOGO_DARK_THEME.png';

export const RegisterPage = () => {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [isPosting, setIsPosting] = useState(false);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPosting(true);

    const formData = new FormData(event.target as HTMLFormElement);

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const rut = formData.get('rut') as string;
    const num_tlf = (formData.get('num_tlf') as string) || undefined;
    const direccion = formData.get('direccion') as string;

    const result = await register({ name, email, password, rut, num_tlf, direccion });

    if (result.ok) {
      toast.success(result.message || 'Registro exitoso');
      navigate('/auth/login');
      return;
    }

    toast.error(result.message || 'Error al registrar usuario');
    setIsPosting(false);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 shadow-xl border-border/80 rounded-2xl bg-card">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-10 flex flex-col justify-center" onSubmit={handleRegister}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center gap-2">
                <CustomLogo subtitle="Registro" size="lg" />
                <p className="text-balance text-sm text-muted-foreground">
                  Crear una nueva cuenta administrativa
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Juan Pérez"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="usuario@soloairespa.cl"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="rut">RUT</Label>
                  <Input
                    id="rut"
                    type="text"
                    name="rut"
                    placeholder="12345678-9"
                    className="rounded-xl"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="num_tlf">Teléfono (Opcional)</Label>
                  <Input
                    id="num_tlf"
                    type="text"
                    name="num_tlf"
                    placeholder="+56 9 1234 5678"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  type="text"
                  name="direccion"
                  placeholder="Av. Providencia 1234"
                  className="rounded-xl"
                  required
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  className="rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-2 h-11 text-base font-semibold"
                disabled={isPosting}
              >
                {isPosting ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes cuenta?{' '}
                <Link
                  to="/auth/login"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
                >
                  Inicia sesión
                </Link>
              </div>
            </div>
          </form>

          {/* Banner lateral derecho */}
          <div className="relative hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 md:flex md:flex-col md:justify-center md:items-center text-white p-10 text-center border-l border-border/20">
            <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 mb-6 shadow-lg">
                <img
                  src={soloAireLogoDark}
                  alt="SoloAireSPA"
                  className="h-24 w-auto object-contain drop-shadow-md"
                />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">Únete a SoloAireSPA</h2>
              <p className="text-sm text-slate-300 max-w-xs leading-relaxed">
                Registra tu perfil para acceder a la gestión de órdenes de trabajo, inventarios y cotizaciones.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
