import { Link } from 'react-router';
import {
  ClipboardList,
  FileSpreadsheet,
  Users,
  ShoppingCart,
  Boxes,
  UserCog,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const DashboardPage = () => {
  const modules = [
    {
      title: 'Órdenes de Trabajo',
      description: 'Gestión y seguimiento de órdenes de servicio técnico y reparaciones.',
      to: '/admin/ordenes',
      icon: ClipboardList,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40',
      controllers: 'OrdenController',
    },
    {
      title: 'Cotizaciones',
      description: 'Generación, aprobación, rechazo y control de presupuestos.',
      to: '/admin/cotizaciones',
      icon: FileSpreadsheet,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40',
      controllers: 'CotizacionController',
    },
    {
      title: 'Clientes',
      description: 'Administración de clientes y registro de pagos recibidos.',
      to: '/admin/clientes',
      icon: Users,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40',
      controllers: 'ClienteController, PagoClienteController',
    },
    {
      title: 'Compras',
      description: 'Control de compras a proveedores e historial de pagos de compras.',
      to: '/admin/compras',
      icon: ShoppingCart,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40',
      controllers: 'CompraController, ProveedorController, PagoCompraController',
    },
    {
      title: 'Inventario',
      description: 'Control de repuestos, marcas, modelos, equipos, insumos y talleres.',
      to: '/admin/inventario',
      icon: Boxes,
      color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/40',
      controllers: 'InventarioController, RepuestoController, EquipoController...',
    },
    {
      title: 'Personal',
      description: 'Gestión del equipo técnico, operadores y administradores.',
      to: '/admin/personal',
      icon: UserCog,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40',
      controllers: 'AdminController, PersonalController',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado inspirado en la imagen */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Módulos Disponibles
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Explora y gestiona las opciones de tu plataforma con precisión
        </p>
      </div>

      {/* Grid de tarjetas de módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.to}
              className="hover:shadow-md transition-all duration-200 border-border bg-card flex flex-col justify-between"
            >
              <CardHeader className="space-y-3 pb-3">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.color}`}
                >
                  <Icon size={24} />
                </div>
                <CardTitle className="text-xl font-semibold text-foreground">
                  {m.title}
                </CardTitle>
                <CardDescription className="text-sm text-muted-foreground line-clamp-2">
                  {m.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-2">
                <Link
                  to={m.to}
                  className="inline-flex items-center text-sm font-medium text-primary hover:underline gap-1.5 group"
                >
                  <span>Entrar al módulo</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardPage;
