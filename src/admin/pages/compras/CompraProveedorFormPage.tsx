import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { getProveedorByIdAction } from '../../actions/get-proveedor-by-id.action';
import { useProveedorMutation } from '../../hooks/useProveedorMutation';
import type { CreateUpdateProveedorPayload } from '../../actions/create-update-proveedor.action';

export const CompraProveedorFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  // Hook dedicado para guardar/actualizar proveedor (Estilo Fernando Herrera)
  const { saveProveedor, isPending } = useProveedorMutation();

  // Consulta los datos del proveedor si estamos en modo edición
  const { data: proveedorData, isLoading: isLoadingProveedor } = useQuery({
    queryKey: ['proveedor-item', id],
    queryFn: () => getProveedorByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario local unificado con formData
  const [formData, setFormData] = useState<CreateUpdateProveedorPayload>({
    nombre: '',
    rut: '',
    correo: '',
    num_tlf: '',
    direccion: '',
  });

  // Sincronizar datos al cargar el proveedor existente
  useEffect(() => {
    if (proveedorData) {
      setFormData({
        nombre: proveedorData.nombre || '',
        rut: proveedorData.rut || '',
        correo: proveedorData.correo || '',
        num_tlf: proveedorData.num_tlf || '',
        direccion: proveedorData.direccion || '',
      });
    }
  }, [proveedorData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.nombre ||
      !formData.rut ||
      !formData.correo ||
      !formData.num_tlf ||
      !formData.direccion
    ) {
      toast.warning('Por favor completa todos los campos requeridos');
      return;
    }

    saveProveedor({
      payload: formData,
      id: isCreating ? undefined : id,
    });
  };

  if (isLoadingProveedor) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/compras/proveedores"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Nuevo Proveedor' : 'Editar Proveedor'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo proveedor al catálogo comercial'
                : `Actualiza la información comercial del proveedor #${id}`}
            </p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Nombre / Razón Social */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Nombre / Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej. Comercial Repuestos Climatización SpA"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* RUT */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              RUT Tributario <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="rut"
              value={formData.rut}
              onChange={handleChange}
              placeholder="Ej. 76.123.456-7"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="Ej. ventas@proveedor.cl"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Teléfono */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Número Telefónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="num_tlf"
              value={formData.num_tlf}
              onChange={handleChange}
              placeholder="Ej. +56 9 8765 4321"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Dirección */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Dirección Comercial <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej. Av. Providencia 1234, Santiago"
              required
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Acciones del Formulario */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/compras/proveedores"
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : isCreating ? 'Crear Proveedor' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompraProveedorFormPage;
