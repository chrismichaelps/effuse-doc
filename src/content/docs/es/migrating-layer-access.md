---
title: Migrar el Acceso a Capas
---

# Migrar el Acceso a Capas

Esta guía lleva las aplicaciones existentes desde el acceso global por cadenas
hacia referencias concretas de capa y alias locales. Las APIs de compatibilidad
siguen disponibles, de modo que la migración puede ser incremental.

## Modelo Objetivo

```tsx
const app = await createApp(App).useLayers([AuthLayer]);

const Profile = define({
  layers: { auth: AuthLayer } as const,
  script({ layers: { auth } }) {
    return {
      user: auth.service('auth').currentUser(),
      session: auth.prop('session'),
    };
  },
  template: ({ user }) => <p>{user?.name}</p>,
});
```

La raíz de composición es la dueña de la inicialización. El componente es dueño
de su alias local. El objeto de capa concreto transporta los tipos de servicios
y props entre ambos.

## 1. Renombrar `provides` a `services`

Antes:

```ts
defineLayer({
  name: 'auth',
  provides: { auth: () => authService },
});
```

Después:

```ts
export const AuthLayer = defineLayer({
  name: 'auth',
  services: { auth: () => authService },
});
```

`provides` sigue siendo un alias de compatibilidad. No mezcles `provides` y
`services` para la misma capacidad.

## 2. Sustituir el Acceso a Servicios por Cadena

Antes:

```ts
script({ useStore, useService }) {
  const auth = useStore('auth');
  const session = useService('session');
}
```

Después:

```ts
layers: { auth: AuthLayer } as const,
script({ layers: { auth } }) {
  const authService = auth.service('auth');
  const session = auth.prop('session');
}
```

Para una llamada puntual de transición, `useService(AuthLayer, 'auth')` conserva
el tipado de la capa concreta sin añadir un alias local. Los registros de alias
siguen siendo la forma preferida cuando un componente consume más de un miembro
de la capa.

## 3. Sustituir las Dependencias de Hooks

Antes:

```ts
defineHook({
  deps: ['auth'],
  setup({ layerProvider }) {
    return layerProvider('auth');
  },
});
```

Después:

```ts
defineHook({
  layers: { auth: AuthLayer } as const,
  setup({ layers: { auth } }) {
    return auth.service('auth');
  },
});
```

Los hooks y los componentes comparten ahora el mismo vocabulario de dependencias
y los mismos diagnósticos de capa ausente.

## 4. Eliminar la Ampliación del Registro

Elimina las declaraciones de `EffuseLayerRegistry` cuando todos los consumidores
infieran su contrato desde objetos de capa concretos. Mantén la ampliación solo
mientras siga existiendo alguna llamada por cadena sin migrar.

## 5. Mover el Trabajo de Servidor a las Capas Propietarias

Traslada los handlers desconectados a `server.api` o `server.actions`, o adapta
los archivos existentes con `fromServerFiles`. Los handlers de servidor pasan
entonces a inferir los mismos servicios que usan los componentes y aparecen en
`createLayerServerManifest`.

## 6. Verificar la Raíz de Composición

Toda capa declarada como consumida debe registrarse antes del montaje en cliente
o del manejo de peticiones en servidor. Ejecuta las rutas anidadas y perezosas
durante la migración; Effuse informa del componente o hook, el alias, la capa
concreta y la corrección de registro cuando falta un binding.

## Lista de Verificación de la Migración

- [ ] Cada dominio exporta un objeto de capa concreto.
- [ ] Las nuevas declaraciones de servicios usan `services`.
- [ ] Los componentes y hooks usan registros de alias.
- [ ] Se han eliminado las llamadas por cadena `useStore`, `useService` y a props de capa.
- [ ] La ampliación del registro se elimina cuando ya no es necesaria.
- [ ] Las APIs y acciones de servidor pertenecen a capas o están adaptadas a ellas.
- [ ] El mismo grafo de capas se pasa al cliente, al SSR, al handler y al manifiesto.
- [ ] Pasan el typecheck, las pruebas focalizadas y las sondas de integración de rutas perezosas.
