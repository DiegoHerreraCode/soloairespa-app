import { createBrowserRouter, Navigate } from 'react-router';
import { lazy } from 'react';
import { LoginPage } from './auth/pages/login/LoginPage';
import { RegisterPage } from './auth/pages/register/RegisterPage';
import { ForgotPasswordPage } from './auth/pages/forgot-password/ForgotPasswordPage';
import { DashboardPage } from './admin/pages/dashboard/DashboardPage';
import { FinanzasPage } from './admin/pages/finanzas/FinanzasPage';
import { PersonalMenuPage } from './admin/pages/personal/PersonalMenuPage';
import { PersonalTallerPage } from './admin/pages/personal/PersonalTallerPage';
import { PersonalTallerFormPage } from './admin/pages/personal/PersonalTallerFormPage';
import { AdministradoresPage } from './admin/pages/personal/AdministradoresPage';
import { ModulePlaceholder } from './admin/pages/ModulePlaceholder';
import { AuthenticatedRoute, NotAuthenticatedRoute } from './components/routes/ProtectedRoutes';

// Lazy loading de layouts
const AuthLayout = lazy(() => import('./auth/layouts/AuthLayout'));
const AdminLayout = lazy(() => import('./admin/layouts/AdminLayout'));

export const appRouter = createBrowserRouter([
  // Redirección de raíz hacia el panel de administración
  {
    path: '/',
    element: <Navigate to="/admin" replace />,
  },

  // Rutas públicas de autenticación (solo para usuarios no autenticados)
  {
    path: '/auth',
    element: (
      <NotAuthenticatedRoute>
        <AuthLayout />
      </NotAuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: auth
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login', // ruta: auth/login
        element: <LoginPage />,
      },
      {
        path: 'register', // ruta: auth/register
        element: <RegisterPage />,
      },
      {
        path: 'forgot-password', // ruta: auth/forgot-password
        element: <ForgotPasswordPage />,
      },
    ],
  },

  // Rutas privadas de administración (requieren autenticación)
  {
    path: '/admin',
    element: (
      <AuthenticatedRoute>
        <AdminLayout />
      </AuthenticatedRoute>
    ),
    children: [
      {
        index: true, // ruta: admin
        element: <DashboardPage />,
      },
      {
        path: 'ordenes', // ruta: admin/ordenes
        element: (
          <ModulePlaceholder
            title="Órdenes de Trabajo"
            description="Gestión y estado de órdenes mediante OrdenController."
          />
        ),
      },
      {
        path: 'cotizaciones', // ruta: admin/cotizaciones
        element: (
          <ModulePlaceholder
            title="Cotizaciones"
            description="Aprobación y control de presupuestos mediante CotizacionController."
          />
        ),
      },
      {
        path: 'clientes', // ruta: admin/clientes
        element: (
          <ModulePlaceholder
            title="Clientes y Pagos"
            description="Gestión de clientes y recaudaciones con ClienteController y PagoClienteController."
          />
        ),
      },
      {
        path: 'compras', // ruta: admin/compras
        element: (
          <ModulePlaceholder
            title="Compras y Proveedores"
            description="Control de proveedores, compras y pagos con CompraController, ProveedorController y PagoCompraController."
          />
        ),
      },
      {
        path: 'inventario', // ruta: admin/inventario
        element: (
          <ModulePlaceholder
            title="Inventario y Servicios"
            description="Control de repuestos, marcas, modelos, insumos, reparaciones y equipos."
          />
        ),
      },
      {
        path: 'personal',
        children: [
          {
            index: true, // ruta: admin/personal (Menú de selección con los 2 cards)
            element: <PersonalMenuPage />,
          },
          {
            path: 'taller', // ruta: admin/personal/taller (Listado con tarjetas)
            element: <PersonalTallerPage />,
          },
          {
            path: 'taller/:id', // ruta: admin/personal/taller/:id (crear y editar estilo Fernando Herrera con :id = 'new' o id numérico)
            element: <PersonalTallerFormPage />,
          },
          {
            path: 'administradores', // ruta: admin/personal/administradores
            element: <AdministradoresPage />,
          },
        ],
      },
      {
        path: 'finanzas', // ruta: admin/finanzas
        element: <FinanzasPage />,
      },
    ],
  },

  // Comodín / 404
  {
    path: '*',
    element: <Navigate to="/admin" replace />,
  },
]);
