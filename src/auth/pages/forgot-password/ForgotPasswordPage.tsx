import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CustomLogo } from '@/components/custom/CustomLogo';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  forgotPasswordAction,
  verifyCodeAction,
  resetPasswordAction,
} from '@/auth/actions/password-recovery.action';

type Step = 'email' | 'code' | 'password';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  //const [codigo, setCodigo] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Paso 1: Enviar correo de recuperación
  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPosting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const targetEmail = formData.get('email') as string;

    try {
      await forgotPasswordAction(targetEmail);
      setEmail(targetEmail);
      toast.success('Código de verificación enviado');
      setStep('code');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al enviar código');
    } finally {
      setIsPosting(false);
    }
  };

  // Paso 2: Verificar código numérico de 6 dígitos
  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPosting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const inputCode = formData.get('codigo') as string;

    try {
      await verifyCodeAction(email, inputCode);
      //setCodigo(inputCode);
      toast.success('Código validado correctamente');
      setStep('password');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Código incorrecto');
    } finally {
      setIsPosting(false);
    }
  };

  // Paso 3: Restablecer contraseña
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPosting(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get('password') as string;

    try {
      await resetPasswordAction(email, password);
      toast.success('Contraseña actualizada con éxito');
      navigate('/auth/login');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Error al restablecer contraseña');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden p-0 shadow-lg border">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6 max-w-sm mx-auto">
            <div className="flex flex-col items-center text-center gap-1">
              <CustomLogo subtitle="Recuperación" />
              <p className="text-balance text-sm text-muted-foreground">
                {step === 'email' && 'Ingresa tu correo para recibir un código'}
                {step === 'code' && `Ingresa el código de 6 dígitos enviado a ${email}`}
                {step === 'password' && 'Ingresa tu nueva contraseña'}
              </p>
            </div>

            {step === 'email' && (
              <form className="flex flex-col gap-4" onSubmit={handleSendEmail}>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" name="email" placeholder="usuario@soloairespa.cl" required />
                </div>
                <Button type="submit" disabled={isPosting}>
                  {isPosting ? 'Enviando...' : 'Enviar Código'}
                </Button>
              </form>
            )}

            {step === 'code' && (
              <form className="flex flex-col gap-4" onSubmit={handleVerifyCode}>
                <div className="grid gap-2">
                  <Label htmlFor="codigo">Código de Verificación (6 dígitos)</Label>
                  <Input
                    id="codigo"
                    name="codigo"
                    maxLength={6}
                    placeholder="000000"
                    className="text-center text-lg tracking-widest font-mono"
                    required
                  />
                </div>
                <Button type="submit" disabled={isPosting}>
                  {isPosting ? 'Validando...' : 'Validar Código'}
                </Button>
              </form>
            )}

            {step === 'password' && (
              <form className="flex flex-col gap-4" onSubmit={handleResetPassword}>
                <div className="grid gap-2">
                  <Label htmlFor="password">Nueva Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Mínimo 8 caracteres"
                    required
                  />
                </div>
                <Button type="submit" disabled={isPosting}>
                  {isPosting ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
              </form>
            )}

            <div className="text-center text-sm">
              <Link to="/auth/login" className="text-primary hover:underline underline-offset-4">
                Volver a Iniciar Sesión
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
