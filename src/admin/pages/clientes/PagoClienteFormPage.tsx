import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Save,
  Receipt,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react';
import { getPagoClienteByIdAction } from '../../actions/get-pago-cliente-by-id.action';
import { getClientesAction } from '../../actions/get-clientes.action';
import { getOrdenesAction } from '../../actions/get-ordenes.action';
import { usePagoClienteMutation } from '../../hooks/usePagoClienteMutation';

export const PagoClienteFormPage = () => {
  const { id } = useParams<{ id: string }>();

  // Si id === 'new', estamos creando; de lo contrario es visualización de solo lectura
  const isCreating = !id || id === 'new';

  const { createPago, isCreating: isSavingNew } = usePagoClienteMutation();

  // 1. Consulta los datos del pago si estamos en modo detalle
  const { data: pagoData, isLoading: isLoadingPago } = useQuery({
    queryKey: ['pago-cliente-item', id],
    queryFn: () => getPagoClienteByIdAction(id!),
    enabled: !isCreating,
  });

  // 2. Consulta clientes y órdenes para los selectores al crear
  const { data: clientes = [] } = useQuery({
    queryKey: ['clientes-select'],
    queryFn: getClientesAction,
    enabled: isCreating,
  });

  const { data: ordenes = [] } = useQuery({
    queryKey: ['ordenes-select'],
    queryFn: getOrdenesAction,
    enabled: isCreating,
  });

  // Estado del formulario para creación
  const [idCliente, setIdCliente] = useState('');
  const [idOrden, setIdOrden] = useState('');
  const [monto, setMonto] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo' | 'cheque'>('transferencia');
  const [numReferencia, setNumReferencia] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Previsualización de imagen al crear
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Enviar creación de nuevo pago
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCliente || !idOrden || !monto || Number(monto) <= 0) {
      toast.warning('Por favor completa todos los campos requeridos con un monto válido');
      return;
    }

    if (metodoPago === 'transferencia' && !selectedImage) {
      toast.warning('Se requiere adjuntar el comprobante para pagos por transferencia');
      return;
    }

    const form = new FormData();
    form.append('id_cliente', idCliente);
    form.append('id_orden', idOrden);
    form.append('monto', monto);
    form.append('fecha_pago', fechaPago);
    form.append('metodo_pago', metodoPago);

    if (metodoPago === 'transferencia') {
      if (numReferencia.trim()) {
        form.append('num_referencia', numReferencia.trim());
      }
      if (selectedImage) {
        form.append('image', selectedImage);
      }
    }

    createPago(form);
  };

  // Resuelve la URL pública del backend para la imagen del comprobante
  const getBackendImageUrl = (path?: string | null) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const baseUrlImg = import.meta.env.VITE_IMG_URL || 'http://localhost:8000';
    return `${baseUrlImg}/${path}`;
  };

  if (isLoadingPago) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isAnulado = pagoData?.estado === 'anulado';

  return (
    <div className="space-y-6 max-w-3xl animate-fadeIn mx-auto">
      {/* Encabezado con Botón Volver */}
      <div className="flex items-center justify-between pb-2 border-b border-border/80">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/clientes/pagos-clientes"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-card border border-border/80 text-foreground hover:bg-accent transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Receipt className="w-6 h-6 text-blue-500" />
              {isCreating ? 'Registrar Pago de Cliente' : `Detalle del Pago #${pagoData?.id_pago_cliente}`}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isCreating
                ? 'Ingresa los datos del abono o liquidación efectuado a una orden de trabajo'
                : 'Información registrada del pago'}
            </p>
          </div>
        </div>

        {!isCreating && (
          <div>
            {isAnulado ? (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <XCircle className="w-3.5 h-3.5" />
                Pago Anulado
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pago Completado
              </span>
            )}
          </div>
        )}
      </div>

      {/* CASO A: MODO CREAR NUEVO PAGO */}
      {isCreating ? (
        <form onSubmit={handleCreateSubmit} className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cliente */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Cliente <span className="text-rose-500">*</span>
              </label>
              <select
                value={idCliente}
                onChange={(e) => setIdCliente(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="">Selecciona un cliente...</option>
                {clientes.map((c) => (
                  <option key={c.id_cliente} value={c.id_cliente}>
                    {c.nombre} ({c.rut})
                  </option>
                ))}
              </select>
            </div>

            {/* Orden de Trabajo */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                N° de Orden de Trabajo <span className="text-rose-500">*</span>
              </label>
              <select
                value={idOrden}
                onChange={(e) => setIdOrden(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="">Selecciona la orden...</option>
                {ordenes.map((o) => (
                  <option key={o.id_orden} value={o.id_orden}>
                    Orden #{o.id_orden} - Pendiente: ${Number(o.monto_pendiente || 0).toLocaleString('es-CL')} (Total: ${Number(o.monto_total || 0).toLocaleString('es-CL')})
                  </option>
                ))}
              </select>
            </div>

            {/* Monto del Pago */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Monto a Pagar ($) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 25000"
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Fecha de Pago */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Fecha de Pago <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Método de Pago */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5">
                Método de Pago <span className="text-rose-500">*</span>
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as any)}
                required
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              >
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="efectivo">Efectivo</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            {/* N° de Referencia / Operación */}
            {metodoPago === 'transferencia' && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  N° de Referencia / Transacción
                </label>
                <input
                  type="text"
                  value={numReferencia}
                  onChange={(e) => setNumReferencia(e.target.value)}
                  placeholder="Ej: TRX-987654"
                  className="w-full px-3.5 py-2 text-sm rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            )}


            {/* Adjuntar Comprobante */}

            {metodoPago === 'transferencia' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Comprobante de Pago {metodoPago === 'transferencia' && <span className="text-rose-500">*</span>}
                </label>
                <div className="border-2 border-dashed border-border/80 rounded-2xl p-4 text-center hover:border-blue-500/40 transition-colors">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleImageChange}
                    id="image-upload"
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                  >
                    <Upload className="w-6 h-6 text-blue-500" />
                    <span className="text-xs font-semibold">
                      {selectedImage ? selectedImage.name : 'Haz clic para seleccionar comprobante (JPEG, PNG)'}
                    </span>
                  </label>
                </div>

                {imagePreview && (
                  <div className="mt-3 flex items-center justify-center">
                    <img
                      src={imagePreview}
                      alt="Vista previa comprobante"
                      className="max-h-48 rounded-xl border border-border object-contain shadow-xs"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
            <Link
              to="/admin/clientes/pagos-clientes"
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSavingNew}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingNew ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      ) : (
        /* CASO B: MODO VER DETALLE */
        <div className="space-y-6">
          {/* Tarjeta de Datos de Solo Lectura */}
          <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Información del Pago
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">N° de Orden</span>
                <span className="text-base font-bold text-foreground">#{pagoData?.id_orden}</span>
              </div>

              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">Monto Abonado</span>
                <span className="text-base font-bold text-foreground">
                  ${Number(pagoData?.monto || 0).toLocaleString('es-CL')}
                </span>
              </div>

              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">Fecha de Pago</span>
                <span className="text-base font-bold text-foreground">
                  {pagoData?.fecha_pago ? pagoData.fecha_pago.split('T')[0] : 'S/F'}
                </span>
              </div>

              <div className="p-3 bg-accent/40 rounded-xl">
                <span className="text-xs text-muted-foreground block">Método de Pago</span>
                <span className="text-base font-bold text-foreground uppercase">
                  {pagoData?.metodo_pago || 'No especificado'}
                </span>
              </div>

              <div className="p-3 bg-accent/40 rounded-xl sm:col-span-2">
                <span className="text-xs text-muted-foreground block">N° de Referencia</span>
                <span className="text-base font-bold text-foreground">
                  {pagoData?.num_referencia || 'Sin número de referencia'}
                </span>
              </div>
            </div>

            {/* Si está anulado, mostrar alerta de motivo de anulación */}
            {isAnulado && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" /> Motivo de Anulación
                </div>
                <p className="text-xs">
                  {pagoData?.motivo_anulacion || 'Sin motivo registrado'}
                </p>
                {pagoData?.fecha_anulacion && (
                  <span className="text-[11px] text-muted-foreground block">
                    Fecha de anulación: {pagoData.fecha_anulacion.split('T')[0]}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sección de Comprobante*/}
          <div className="bg-card p-6 rounded-2xl border border-border/80 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Comprobante de Pago
            </h3>

            {/* Imagen actual si existe */}
            {pagoData?.imagePath ? (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground block">Comprobante Adjunto:</span>
                <div className="flex items-center justify-center p-3 bg-muted/20 rounded-xl border border-border/60">
                  <img
                    src={getBackendImageUrl(pagoData.imagePath) || ''}
                    alt="Comprobante de pago"
                    className="max-h-80 rounded-xl object-contain shadow-xs"
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No hay comprobante de imagen adjunto a este pago.
              </p>
            )}

            <div className="flex justify-end pt-2 border-t border-border/80">
              <Link
                to="/admin/clientes/pagos-clientes"
                className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-card border border-border/80 text-foreground hover:bg-accent transition-colors"
              >
                Volver al Listado
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagoClienteFormPage;
