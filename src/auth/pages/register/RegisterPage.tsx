import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomLogo } from '@/components/custom/CustomLogo';
import { Link, useNavigate } from 'react-router';
import { useAuthStore } from '@/auth/store/auth.store';
import { toast } from 'sonner';
import { useState } from 'react';

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
      <Card className="overflow-hidden p-0 shadow-lg border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleRegister}>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center gap-1">
                <CustomLogo subtitle="Registro" />
                <p className="text-balance text-sm text-muted-foreground">
                  Crear una nueva cuenta
                </p>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" type="text" name="name" placeholder="Juan Pérez" required />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" name="email" placeholder="usuario@soloairespa.cl" required />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="rut">RUT</Label>
                  <Input id="rut" type="text" name="rut" placeholder="12345678-9" required />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="num_tlf">Teléfono</Label>
                  <Input id="num_tlf" type="text" name="num_tlf" placeholder="+56 9 1234 5678" />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" type="text" name="direccion" placeholder="Av. Providencia 1234" required />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                />
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isPosting}>
                {isPosting ? 'Creando cuenta...' : 'Crear Cuenta'}
              </Button>

              <div className="text-center text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link to="/auth/login" className="font-semibold text-primary underline underline-offset-4">
                  Inicia sesión
                </Link>
              </div>
            </div>
          </form>

          <div className="relative hidden bg-slate-900 md:flex md:flex-col md:justify-center md:items-center text-white p-8">
            <h2 className="text-2xl font-bold mb-2">Únete a Solo Aire SpA</h2>
            <p className="text-sm text-slate-300 text-center">
              Registra tu perfil para gestionar órdenes de trabajo, inventarios y cotizaciones.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
