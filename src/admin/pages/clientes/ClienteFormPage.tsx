import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { getClienteByIdAction } from '../../actions/get-cliente-by-id.action';
import { useClienteMutation } from '../../hooks/useClienteMutation';
import type { CreateUpdateClientePayload } from '../../actions/create-update-cliente.action';

export const ClienteFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; en cualquier otro caso estamos editando
  const isCreating = !id || id === 'new';

  // Hook dedicado para guardar/actualizar cliente (Estilo Teslo Shop)
  const { saveCliente, isPending } = useClienteMutation();

  // Consulta los datos del cliente si estamos en modo edición
  const { data: clienteData, isLoading: isLoadingCliente } = useQuery({
    queryKey: ['cliente-item', id],
    queryFn: () => getClienteByIdAction(id!),
    enabled: !isCreating,
  });

  // Estado del formulario local unificado con formData
  const [formData, setFormData] = useState<CreateUpdateClientePayload>({
    nombre: '',
    rut: '',
    correo: '',
    num_tlf: '',
    direccion: '',
  });

  // Sincronizar datos al cargar el cliente existente
  useEffect(() => {
    if (clienteData) {
      setFormData({
        nombre: clienteData.nombre || '',
        rut: clienteData.rut || '',
        correo: clienteData.correo || '',
        num_tlf: clienteData.num_tlf || '',
        direccion: clienteData.direccion || '',
      });
    }
  }, [clienteData]);

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

    saveCliente({
      payload: formData,
      id: isCreating ? undefined : id,
    });
  };

  if (isLoadingCliente) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/clientes/listado"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-500" />
              {isCreating ? 'Registrar Nuevo Cliente' : 'Editar Cliente'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Agrega un nuevo cliente comercial o propietario de repuestos'
                : `Modificando datos comerciales del cliente: ${formData.nombre}`}
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
              Nombre o Razón Social <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Transportes del Norte SpA o Juan Pérez"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
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
              placeholder="Ej: 76.543.210-K"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="contacto@empresa.cl"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Número de Teléfono <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="num_tlf"
              value={formData.num_tlf}
              onChange={handleChange}
              placeholder="+56 9 9876 5432"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Dirección Comercial / Domicilio <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Panamericana Norte km 15, Quilicura"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Botones de Cancelar y Guardar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
          <Link
            to="/admin/clientes/listado"
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isPending ? 'Guardando...' : 'Guardar Información'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClienteFormPage;
