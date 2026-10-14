---
name: react-ts-laravel-stack
description: Buenas prácticas y estándares de arquitectura para desarrollo web con React, TypeScript, TanStack Query, React Hook Form, Axios, Sonner y Shadcn UI, consumiendo un backend en Laravel con PostgreSQL.
---

# Guía de Buenas Prácticas: React + TypeScript (Laravel & PostgreSQL Backend)

Esta guía condensa la arquitectura y patrones probados en el proyecto base (**Teslo Shop**) adaptados a aplicaciones modernas que se conectan a un backend **Laravel** (REST / API Resources) respaldado por **PostgreSQL**.

---

## 1. Arquitectura y Estructura Modular

Organiza el proyecto por módulos o funcionalidades (*features* o *screaming architecture*) para desacoplar el dominio y facilitar la escalabilidad:

```text
src/
├── api/                   # Instancia global de Axios e interceptores (Auth, CSRF/Sanctum)
├── components/
│   ├── ui/                # Componentes atómicos de Shadcn UI (Button, Input, Dialog, etc.)
│   └── shared/            # Componentes reutilizables transversales
├── interfaces/            # Tipos e interfaces globales de TypeScript
├── lib/                   # Utilidades generales (cn helper, formateadores)
└── modules/ (o features/) # Agrupación por funcionalidad (ej. auth, users, products)
    └── [feature-name]/
        ├── actions/       # Peticiones HTTP puras mediante Axios (con tipado estricto)
        ├── hooks/         # Custom hooks que envuelven TanStack Query (queries y mutaciones)
        ├── interfaces/    # DTOs y tipos específicos del módulo
        ├── pages/         # Vistas / Rutas del módulo
        └── ui/ (o components/) # Formularios y componentes específicos de la vista
```

---

## 2. Configuración de Axios & Integración con Laravel

### 2.1 Instancia Base y Manejo de Tokens
Laravel utiliza tokens Bearer (Passport o Sanctum con tokens de API) o cookies HttpOnly (Sanctum SPA). Configura la instancia en [src/api/apiClient.ts](file:///src/api/apiClient.ts):

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Ej: https://api.tu-dominio.com/api/v1
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Indispensable para que Laravel retorne respuestas JSON y errores 422
  },
  // withCredentials: true, // Habilitar únicamente si usas Laravel Sanctum SPA basado en cookies/sesión
});

// Interceptor de Petición: Inyección de Bearer Token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de Respuesta: Manejo Global de Errores Laravel
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Redirigir a login o emitir evento de logout si es necesario
    }
    return Promise.reject(error);
  }
);
```

### 2.2 Manejo de Errores de Validación Laravel (HTTP 422)
Laravel devuelve los errores de validación con el formato:
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```
Crea un helper para mapear estos errores directamente a **React Hook Form**:

```typescript
import { UseFormSetError, FieldValues, Path } from 'react-hook-form';

export interface LaravelValidationError {
  message: string;
  errors?: Record<string, string[]>;
}

export const setLaravelErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
) => {
  if (axios.isAxiosError(error) && error.response?.status === 422) {
    const apiErrors = (error.response.data as LaravelValidationError).errors;
    if (apiErrors) {
      Object.entries(apiErrors).forEach(([key, messages]) => {
        setError(key as Path<T>, {
          type: 'server',
          message: messages[0],
        });
      });
    }
  }
};
```

---

## 3. Acciones Puras (Actions Pattern)

No invoques `axios` directamente dentro de tus componentes o hooks. Separa cada llamada en una función `Action` pura y fuertemente tipada:

```typescript
import { apiClient } from '@/api/apiClient';
import type { User, PaginatedResponse } from '@/interfaces';

interface GetUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
}

// Laravel API Resource paginado
export const getUsersAction = async (params: GetUsersParams): Promise<PaginatedResponse<User>> => {
  const { data } = await apiClient.get<PaginatedResponse<User>>('/users', { params });
  return data;
};

export const createUpdateUserAction = async (userData: Partial<User>): Promise<User> => {
  const isCreating = !userData.id;
  const url = isCreating ? '/users' : `/users/${userData.id}`;
  const method = isCreating ? 'POST' : 'PUT'; // o PATCH

  const { data } = await apiClient.request<User>({
    url,
    method,
    data: userData,
  });

  return data;
};
```

---

## 4. TanStack Query: Gestión de Estado Asíncrono y Caché

### 4.1 Buenas Prácticas para Query Keys
- Utiliza **tuplas tipadas** consistentes: `['entidad', { ...filtros }]`.
- Configura un `staleTime` razonable (por defecto en TanStack Query es 0, lo cual puede generar refetches excesivos al backend Laravel).

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersAction, createUpdateUserAction } from '../actions';
import { toast } from 'sonner';

export const useUsers = (page: number = 1, search: string = '') => {
  const query = useQuery({
    queryKey: ['users', { page, search }],
    queryFn: () => getUsersAction({ page, search }),
    staleTime: 1000 * 60 * 5, // 5 minutos de vigencia en caché
  });

  return query;
};

export const useUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUpdateUserAction,
    onSuccess: (savedUser) => {
      // 1. Invalidar lista para forzar refetch fresco
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // 2. Actualizar inmediatamente la caché del usuario individual
      queryClient.setQueryData(['user', { id: savedUser.id }], savedUser);

      toast.success('Usuario guardado con éxito');
    },
    onError: (error) => {
      // Sonner para feedback visual inmediato si no es un error de formulario 422
      toast.error('Error al guardar el usuario');
    },
  });
};
```

---

## 5. React Hook Form & Shadcn UI

### 5.1 Integración Limpia con Shadcn UI
Aprovecha `react-hook-form` junto a los componentes accesibles y estilosos de Shadcn UI:

```tsx
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { setLaravelErrors } from '@/lib/form-helpers';
import type { User } from '@/interfaces';

interface UserFormData {
  name: string;
  email: string;
  role: string;
}

interface Props {
  user?: User;
  onSubmitAction: (data: UserFormData) => Promise<void>;
  isPending: boolean;
}

export const UserForm = ({ user, onSubmitAction, isPending }: Props) => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'user',
    },
  });

  const onFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmitAction(data);
    } catch (err) {
      setLaravelErrors(err, setError);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          placeholder="Nombre completo"
          {...register('name', { required: 'El nombre es obligatorio' })}
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="email">Correo Electrónico</Label>
        <Input
          id="email"
          type="email"
          placeholder="correo@ejemplo.com"
          {...register('email', {
            required: 'El correo es obligatorio',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Correo inválido',
            },
          })}
        />
        {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Guardando...' : 'Guardar'}
      </Button>
    </form>
  );
};
```

---

## 6. Notificaciones con Sonner

Configura el componente `<Toaster />` en la raíz de tu aplicación y usa `toast` con consistencia:

- **Configuración en raíz (`App.tsx` o `main.tsx`)**:
  ```tsx
  import { Toaster } from 'sonner';

  export function App() {
    return (
      <>
        {/* Contenido / Router */}
        <Toaster richColors position="top-right" closeButton />
      </>
    );
  }
  ```

- **Patrón `toast.promise` para operaciones asíncronas**:
  ```typescript
  toast.promise(mutation.mutateAsync(payload), {
    loading: 'Procesando registro...',
    success: 'Operación realizada correctamente',
    error: (err) => err?.response?.data?.message || 'Ocurrió un error inesperado',
  });
  ```

---

## 7. Buenas Prácticas específicas para PostgreSQL & Laravel

1. **Campos snake_case vs camelCase**:
   - Laravel y PostgreSQL usan habitualmente `snake_case` (`user_id`, `created_at`, `is_active`).
   - Define interfaces en TypeScript que reflejen exactamente los campos devueltos por los **API Resources** de Laravel (o transforma en DTOs si decides utilizar `camelCase` en el frontend).
2. **IDs y Tipos Numéricos/UUIDs**:
   - PostgreSQL soporta tanto enteros autoincrementales como `UUID`. Asegúrate de que las interfaces declaren `id: string` o `id: number` de forma coherente según la migración de Laravel.
3. **Paginación estándar de Laravel**:
   - Tipifica la estructura estándar de paginación (`data`, `meta`, `links` o `current_page`, `last_page`, `total`):
     ```typescript
     export interface LaravelPaginatedResponse<T> {
       data: T[];
       links: {
         first: string | null;
         last: string | null;
         prev: string | null;
         next: string | null;
       };
       meta: {
         current_page: number;
         from: number | null;
         last_page: number;
         per_page: number;
         to: number | null;
         total: number;
       };
     }
     ```
4. **Envío de archivos con FormData**:
   - Cuando envíes archivos con peticiones `PUT`/`PATCH` a Laravel, recuerda que PHP/Laravel a veces tiene limitaciones procesando `multipart/form-data` en verbos `PUT`. La buena práctica en Laravel es hacer una petición `POST` e incluir `_method: 'PUT'` o usar un endpoint dedicado para uploads.

---

## 8. Enrutamiento con React Router (v7 / Data Routers)

El proyecto utiliza `createBrowserRouter` y `RouterProvider` junto a *Protected Routes* y *Lazy Loading*:

### 8.1 Definición Declarativa y Lazy Loading
Organiza las rutas agrupándolas por layouts (*ShopLayout*, *AuthLayout*, *AdminLayout*) y carga bajo demanda las secciones pesadas:

```tsx
import { createBrowserRouter, Navigate } from 'react-router';
import { lazy, Suspense } from 'react';
import { AdminRoute, NotAuthenticatedRoute, AuthenticatedRoute } from '@/components/routes/ProtectedRoutes';

// Lazy loading de vistas y layouts
const AdminLayout = lazy(() => import('@/admin/layouts/AdminLayout'));
const DashboardPage = lazy(() => import('@/admin/pages/dashboard/DashboardPage'));

export const appRouter = createBrowserRouter([
  // Rutas públicas
  {
    path: '/',
    element: <ShopLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'product/:idSlug', element: <ProductPage /> },
    ],
  },

  // Rutas de autenticación (sólo para no autenticados)
  {
    path: '/auth',
    element: (
      <NotAuthenticatedRoute>
        <AuthLayout />
      </NotAuthenticatedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/auth/login" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },

  // Rutas protegidas (por rol o autenticación)
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'products', element: <AdminProductsPage /> },
    ],
  },

  // Wildcard 404
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

### 8.2 Guardianes de Rutas (Protected Routes Pattern)
Evita parpadeos (*flashes*) de redirección mientras se verifica el estado de sesión (por ejemplo, validando el token contra Laravel o en el store de autenticación):

```tsx
import { Navigate } from 'react-router';
import type { PropsWithChildren } from 'react';
import { useAuthStore } from '@/auth/store/auth.store';

export const AuthenticatedRoute = ({ children }: PropsWithChildren) => {
  const { authStatus } = useAuthStore();

  // Mientras se valida el token o sesión con Laravel, no redirigir
  if (authStatus === 'checking') return null;

  if (authStatus === 'not-authenticated') {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
};

export const NotAuthenticatedRoute = ({ children }: PropsWithChildren) => {
  const { authStatus } = useAuthStore();

  if (authStatus === 'checking') return null;

  if (authStatus === 'authenticated') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }: PropsWithChildren) => {
  const { authStatus, user } = useAuthStore();

  if (authStatus === 'checking') return null;

  if (authStatus === 'not-authenticated') {
    return <Navigate to="/auth/login" replace />;
  }

  // Validación de roles devueltos por Laravel (ej. Spatie Permission o campo 'roles')
  const isAdmin = user?.roles?.includes('admin') || user?.role === 'admin';
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};
```

### 8.3 Inicialización con Proveedores (Setup en `App.tsx`)
Asegura el orden jerárquico de los *providers*:
1. `QueryClientProvider` (TanStack Query)
2. `Toaster` (Sonner)
3. Provider de comprobación de autenticación (`CheckAuthProvider`)
4. `RouterProvider` (React Router)

```tsx
import { RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { appRouter } from './app.router';
import { CheckAuthProvider } from './auth/components/CheckAuthProvider';

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <CheckAuthProvider>
        <RouterProvider router={appRouter} />
      </CheckAuthProvider>
    </QueryClientProvider>
  );
};
```

