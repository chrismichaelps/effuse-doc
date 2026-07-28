---
title: APIs y Acciones de Servidor
---

# APIs y Acciones de Servidor

Las funciones de servidor de Effuse extienden el grafo de capas. Una capacidad
posee sus servicios, rutas HTTP, acciones, validación, fallos, middleware,
metadatos, entradas de manifiesto y contrato de cliente en una sola definición.

## Rutas de API

```ts
import { defineLayer, LayerServerError } from '@effuse/core';

export const UsersLayer = defineLayer({
  name: 'users',
  services: {
    users: () => ({
      find: (id: string) => ({ id, name: 'Chris' }),
      create: (name: string) => ({ id: crypto.randomUUID(), name }),
    }),
  },
  server: {
    api: {
      '/api/users/[id]': {
        GET: ({ params, services }) => {
          const user = services.users.find(params.id);
          if (!user) {
            throw new LayerServerError('USER_NOT_FOUND', 'User not found.', {
              status: 404,
              details: { id: params.id },
            });
          }
          return user;
        },
      },
    },
  },
});
```

Los handlers reciben la URL de la petición, los params, la query, los servicios
de la capa, todos los conjuntos de servicios, lectores del cuerpo, validación,
helpers de respuesta y el contexto de la petición. Los objetos planos se
serializan como JSON; los valores `Response` pasan tal cual.

## Validación y Formularios

Los validadores pueden ser funciones u objetos de esquema con métodos `parse` o
`safeParse`.

```ts
const parseLogin = (value: unknown): { email: string; password: string } => {
  const input = value as Record<string, unknown>;
  if (!input || typeof input.email !== 'string' || typeof input.password !== 'string') {
    throw new Error('email and password are required');
  }
  return { email: input.email, password: input.password };
};

export const AuthLayer = defineLayer({
  name: 'auth',
  services: {
    auth: () => ({
      login: (email: string, password: string) =>
        password === 'secret' ? { id: 'u1', email } : null,
    }),
  },
  server: {
    api: {
      '/api/auth/login': {
        POST: async ({ validate, services, response }) => {
          const input = await validate.formData(parseLogin);
          const user = services.auth.login(input.email, input.password);
          if (!user) {
            return response.error('INVALID_CREDENTIALS', 'Login failed.', {
              status: 401,
            });
          }
          return response.redirect('/dashboard', 303);
        },
      },
    },
  },
});
```

Los fallos de validación devuelven `400` con `EFFUSE_VALIDATION_FAILED`, el
origen de la entrada y las incidencias normalizadas. Los fallos de dominio usan
`LayerServerError` o `response.error(code, message, options)`.

## Subidas de Archivos

```ts
const UploadLayer = defineLayer({
  name: 'uploads',
  server: {
    api: {
      '/api/uploads': {
        POST: async ({ formData, response }) => {
          const data = await formData();
          const file = data.get('file');
          if (!(file instanceof File)) {
            return response.error('FILE_REQUIRED', 'Select a file.', {
              status: 400,
            });
          }
          return { name: file.name, size: file.size, type: file.type };
        },
      },
    },
  },
});
```

Effuse analiza datos multiparte pero no elige el almacenamiento. Transmite o
persiste el archivo a través de un servicio de capa para que la política de
almacenamiento siga siendo reemplazable y comprobable.

## Acciones

Las acciones son operaciones POST con ámbito de capa para mutaciones de dominio
que no necesitan una forma de ruta pública.

```ts
export const CartLayer = defineLayer({
  name: 'cart',
  services: {
    cart: () => ({ refresh: () => ({ total: 42 }) }),
  },
  server: {
    actions: {
      refresh: ({ services }) => services.cart.refresh(),
    },
  },
});

const cartActions = createLayerActionClient(CartLayer);
const cart = await cartActions.refresh();
```

Las URLs de acción incluyen el nombre de la capa:

```text
/_effuse/actions/cart/refresh
```

Por eso dos capas pueden poseer una acción con el mismo nombre local sin
colisionar:

```ts
const authActions = createLayerActionClient(AuthLayer);
const billingActions = createLayerActionClient(BillingLayer);

await authActions.refresh();
await billingActions.refresh();
```

La URL de acción sin ámbito existe por compatibilidad. Los clientes nuevos
deberían usar el objeto de capa o un cliente de manifiesto para que la
propiedad de la acción quede explícita.

## Manifiestos y Clientes Tipados

```ts
const manifest = createLayerServerManifest([UsersLayer, CartLayer]);
const client = createLayerServerManifestClient(manifest, {
  baseUrl: 'https://example.com',
});

await client.route('/api/users/[id]', {
  method: 'GET',
  params: { id: 'u1' },
});

await client.action('cart', 'refresh');
```

Los manifiestos literales restringen nombres de capa, acciones, rutas, métodos
y params. `generateLayerServerClientModule` emite un módulo determinista con el
manifiesto, la factoría y el tipo de cliente inferido.

## Adaptador de Sistema de Archivos

Los equipos que prefieren carpetas al estilo de Next pueden mapearlas a una capa:

```ts
import {
  defineLayer,
  fromServerFiles,
  type ServerActionFileModule,
  type ServerApiFileModule,
} from '@effuse/core';

const files = import.meta.glob<ServerApiFileModule | ServerActionFileModule>(
  ['/src/server/api/**/*.ts', '/src/server/actions/**/*.ts'],
  { eager: true }
);

export const AppServerLayer = defineLayer({
  name: 'app-server',
  server: fromServerFiles(files),
});
```

Las raíces por defecto incluyen `src/server/api`, `app/api`, `src/api`,
`src/server/actions`, `app/actions` y `src/actions`. Los params entre corchetes
y los grupos de rutas se mapean al mismo matcher de runtime y al mismo
manifiesto. Los archivos duplicados o ambiguos se convierten en diagnósticos del
manifiesto.

La convención de carpetas es un adaptador de entrada. No crea un segundo runtime
de servidor junto a las capas.

## Pipeline de Peticiones

```text
petición
  -> coincidencia de ruta
  -> middleware de capa en orden de dependencias
  -> middleware de ruta/acción
  -> validación y handler
  -> política de respuesta según metadatos
  -> evento de traza
  -> respaldo SSR cuando ningún endpoint de servidor coincide
```

Los metadatos de ruta/acción admiten cache, CORS, runtime, región, duración y
datos de política personalizados. Los hooks de observabilidad reciben eventos de
traza de servidor estables; el fallo de un sumidero no reemplaza la respuesta de
la aplicación.

## Reglas de Producción

1. Mantén las rutas y acciones junto a la capa que posee sus servicios.
2. Valida los datos de petición no confiables en el límite del handler.
3. Devuelve errores de dominio estructurados en lugar de analizar cadenas de error.
4. Usa clientes de acción con ámbito cuando los nombres se repitan entre dominios.
5. Genera clientes desde manifiestos en lugar de duplicar rutas de fetch.
6. Trata las rutas de archivo como entradas de capa e inspecciona los diagnósticos del manifiesto en CI.
7. Mantén subidas, persistencia, autenticación y telemetría detrás de servicios.
