import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, ShieldCheck, Eye, EyeOff, Lock } from 'lucide-react';
import { getAdminByIdAction } from '../../actions/get-admin-by-id.action';
import { useAdminMutation } from '../../hooks/useAdminMutation';

export const AdministradoresFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  // Hook para mutación crear/editar estilo Teslo Shop
  const { saveAdmin, isPending } = useAdminMutation();

  // Consulta datos del admin si estamos en modo edición
  const { data: adminData, isLoading: isLoadingAdmin } = useQuery({
    queryKey: ['admin-item', id],
    queryFn: () => getAdminByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario unificado
  const [formData, setFormData] = useState({
    nombre: '',
    rut: '',
    correo: '',
    num_tlf: '',
    direccion: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Precargar datos al editar
  useEffect(() => {
    if (adminData) {
      setFormData({
        nombre: adminData.nombre || '',
        rut: adminData.rut || '',
        correo: adminData.user?.email || '',
        num_tlf: adminData.num_tlf || '',
        direccion: adminData.direccion || '',
        password: '',
      });
    }
  }, [adminData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isCreating) {
      // Validaciones para nuevo admin (AuthController.php register)
      if (
        !formData.nombre ||
        !formData.rut ||
        !formData.correo ||
        !formData.direccion ||
        !formData.password
      ) {
        toast.warning('Por favor completa todos los campos requeridos');
        return;
      }

      // Validación de contraseña según regex de AuthController: min 8, mayúscula, minúscula, número
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        toast.error(
          'La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula y un número.'
        );
        return;
      }

      saveAdmin({
        payload: {
          name: formData.nombre,
          email: formData.correo,
          password: formData.password,
          rut: formData.rut,
          num_tlf: formData.num_tlf,
          direccion: formData.direccion,
        },
      });
    } else {
      // Validaciones para edición (AdminController.php update - el correo no se edita)
      if (!formData.nombre || !formData.rut || !formData.direccion) {
        toast.warning('Por favor completa los campos requeridos');
        return;
      }

      saveAdmin({
        payload: {
          nombre: formData.nombre,
          rut: formData.rut,
          num_tlf: formData.num_tlf,
          direccion: formData.direccion,
        },
        id,
      });
    }
  };

  if (isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/personal/administradores"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-purple-500" />
              {isCreating ? 'Registrar Nuevo Administrador' : 'Editar Administrador'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Crea un nuevo usuario en el sistema con credenciales de acceso administrativo'
                : `Modificando perfil de contacto del administrador: ${formData.nombre}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Rodrigo Valenzuela"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* RUT */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              RUT <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="Ej: 11.222.333-4"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Número de Teléfono
            </label>
            <input
              type="text"
              name="num_tlf"
              value={formData.num_tlf}
              onChange={handleChange}
              placeholder="+56 9 8765 4321"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>

          {/* Correo Electrónico (Consideración 2: Al editar es solo lectura) */}
          <div className={isCreating ? '' : 'sm:col-span-2'}>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Correo Electrónico <span className="text-rose-500">*</span>
              {!isCreating && (
                <span className="ml-2 text-[11px] font-normal text-muted-foreground">
                  (El correo del usuario no es editable)
                </span>
              )}
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="admin@soloairespa.cl"
              required
              readOnly={!isCreating}
              disabled={!isCreating}
              className={`w-full px-3.5 py-2 text-sm rounded-xl border border-border/80 text-foreground focus:outline-none transition-all ${
                !isCreating
                  ? 'bg-muted/60 text-muted-foreground cursor-not-allowed select-none'
                  : 'bg-background focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500'
              }`}
            />
          </div>

          {/* Contraseña (Consideración 3: Solo requerida al crear mediante AuthController register) */}
          {isCreating && (
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Contraseña de Acceso <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Mín. 8 caracteres, Aa y números"
                  required
                  className="w-full pl-3.5 pr-10 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Debe tener mayúscula, minúscula y número
              </span>
            </div>
          )}

          {/* Dirección */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Dirección Residencial <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Av. Las Condes 987, Santiago"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500"
            />
          </div>
        </div>

        {/* Botones de Cancelar y Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/personal/administradores"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdministradoresFormPage;
