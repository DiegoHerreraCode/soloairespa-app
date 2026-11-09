import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Save, Building2, Package, Plus, Trash2 } from 'lucide-react';
import { getProveedorByIdAction } from '../../actions/get-proveedor-by-id.action';
import { getInventarioAction } from '../../actions/get-inventario.action';
import { useProveedorMutation } from '../../hooks/useProveedorMutation';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { CreateUpdateProveedorPayload } from '../../actions/create-update-proveedor.action';

interface ItemFila {
  id_inventario: number | '';
  codigo_proveedor: string;
  ultimo_monto_compra: number | '';
}

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

  // Consulta catálogo completo de inventario
  const { data: inventario = [] } = useQuery({
    queryKey: ['inventario-catalogo'],
    queryFn: getInventarioAction,
  });

  // Estado del formulario local unificado con formData
  const [formData, setFormData] = useState<CreateUpdateProveedorPayload>({
    nombre: '',
    rut: '',
    correo: '',
    num_tlf: '',
    direccion: '',
  });

  // Items de inventario asociados a este proveedor
  const [itemsAsociados, setItemsAsociados] = useState<ItemFila[]>([]);

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

      if (proveedorData.inventario_proveedores && proveedorData.inventario_proveedores.length > 0) {
        setItemsAsociados(
          proveedorData.inventario_proveedores.map((ip) => ({
            id_inventario: ip.id_inventario,
            codigo_proveedor: ip.codigo_proveedor || '',
            ultimo_monto_compra: ip.ultimo_monto_compra !== undefined && ip.ultimo_monto_compra !== null ? Number(ip.ultimo_monto_compra) : '',
          }))
        );
      }
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

    // Validar filas de items
    for (let i = 0; i < itemsAsociados.length; i++) {
      const it = itemsAsociados[i];
      if (!it.id_inventario) {
        toast.warning(`Fila #${i + 1}: Debe seleccionar un ítem de inventario`);
        return;
      }
      if (!it.codigo_proveedor.trim()) {
        toast.warning(`Fila #${i + 1}: Ingrese el código de proveedor del ítem`);
        return;
      }
    }

    // Validar duplicados de id_inventario
    const idsSet = new Set<number>();
    for (const it of itemsAsociados) {
      if (it.id_inventario) {
        if (idsSet.has(Number(it.id_inventario))) {
          toast.warning('No puedes asociar el mismo ítem de inventario más de una vez');
          return;
        }
        idsSet.add(Number(it.id_inventario));
      }
    }

    const payload: CreateUpdateProveedorPayload = {
      ...formData,
      items: itemsAsociados.map((it) => ({
        id_inventario: Number(it.id_inventario),
        codigo_proveedor: it.codigo_proveedor.trim(),
        ultimo_monto_compra: it.ultimo_monto_compra !== '' ? Number(it.ultimo_monto_compra) : 0,
      })),
    };

    saveProveedor({
      payload,
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

        {/* Sección: Ítems que este proveedor suministra / Catálogo */}
        <div className="pt-2 border-t border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-blue-500" />
                Ítems de Inventario que Suministra este Proveedor
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Selecciona los ítems que vende este proveedor, su código de catálogo y último costo de compra
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setItemsAsociados((prev) => [
                  ...prev,
                  { id_inventario: '', codigo_proveedor: '', ultimo_monto_compra: '' },
                ])
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Asociar Ítem
            </button>
          </div>

          {itemsAsociados.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border/80 text-center text-xs text-muted-foreground bg-muted/10">
              No hay ítems asociados a este proveedor. Puedes agregarlos ahora o vincularlos después en compras o inventario.
            </div>
          ) : (
            <div className="space-y-2.5">
              {itemsAsociados.map((itRow, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/70 items-center animate-fadeIn"
                >
                  {/* Ítem de Inventario */}
                  <div className="sm:col-span-5 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Ítem de Inventario <span className="text-rose-500">*</span>
                    </label>
                    <SearchableSelect
                      options={inventario.map((inv) => ({
                        value: inv.id_inventario,
                        label: inv.nombre,
                        sublabel: `SKU: ${inv.sku || 'Sin SKU'} • ${inv.tipo}`,
                        searchTerms: `${inv.nombre} ${inv.sku || ''} ${inv.tipo}`,
                      }))}
                      value={itRow.id_inventario}
                      onChange={(val) => {
                        const numVal = val ? Number(val) : '';
                        setItemsAsociados((prev) => {
                          const next = [...prev];
                          next[idx].id_inventario = numVal;
                          if (numVal && !next[idx].codigo_proveedor) {
                            const sel = inventario.find((i) => i.id_inventario === numVal);
                            if (sel?.sku) next[idx].codigo_proveedor = sel.sku;
                          }
                          return next;
                        });
                      }}
                      placeholder="Selecciona ítem..."
                      searchPlaceholder="Buscar por nombre, SKU o tipo..."
                      required
                    />
                  </div>

                  {/* Código Proveedor */}
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Código Proveedor <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={itRow.codigo_proveedor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setItemsAsociados((prev) => {
                          const next = [...prev];
                          next[idx].codigo_proveedor = val;
                          return next;
                        });
                      }}
                      placeholder="Ej: 13703-2"
                      required
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Último Costo Compra */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Último Costo ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={itRow.ultimo_monto_compra}
                      onChange={(e) => {
                        const val = e.target.value === '' ? '' : Number(e.target.value);
                        setItemsAsociados((prev) => {
                          const next = [...prev];
                          next[idx].ultimo_monto_compra = val;
                          return next;
                        });
                      }}
                      placeholder="0"
                      className="w-full px-3 py-1.5 text-xs rounded-lg bg-background border border-border/80 text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                  </div>

                  {/* Botón Eliminar Fila */}
                  <div className="sm:col-span-1 flex justify-center pt-3 sm:pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setItemsAsociados((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar asociación"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
