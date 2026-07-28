---
title: Por Qué Effuse
---

# Por Qué Effuse

Effuse existe para equipos que quieren que el código frontend se sienta pequeño
en el borde del componente, manteniendo a la vez las capacidades de la
aplicación explícitas, tipadas y comprobables.

React ofrece un alcance amplio de ecosistema. Vue ofrece una ergonomía de
componentes accesible. Solid ofrece reactividad de grano fino. Next ofrece
primitivas de aplicación del lado del servidor. Effuse debe ganarse su lugar
combinando las partes útiles de esas ideas alrededor de un único contrato: las
capas definen capacidades de la aplicación, los componentes consumen esas
capacidades con nombres locales, y las rutas y acciones de servidor viven junto
a los servicios que las poseen.

## La Brecha

La mayoría de los frameworks reparten una aplicación entre demasiadas
superficies desconectadas:

| Necesidad             | Fricción habitual                                                           |
| --------------------- | --------------------------------------------------------------------------- |
| Servicios compartidos | Módulos globales, árboles de contexto o inyección sin tipos                 |
| APIs de servidor      | Archivos de rutas separados que se desvían de la capa de servicios          |
| Lógica de componentes | Proliferación de hooks/imports y dependencias implícitas en runtime         |
| Reactividad           | Rerenderizados gruesos o magia del compilador con límites poco claros       |
| Pruebas               | La capacidad de negocio y el código de UI se prueban por costuras distintas |

Effuse debe hacer esos límites explícitos sin volver pesado el código del
componente.

## El Contrato de Effuse

1. Las capas poseen capacidades.
2. Los componentes y hooks importan capacidades localmente mediante `layers`.
3. Los servicios se tipan a partir de la definición de la capa.
4. Las rutas y acciones de servidor se declaran en la capa que posee los datos.
5. Las señales de grano fino actualizan solo la UI dependiente.

```tsx
const AuthLayer = defineLayer({
  name: 'platformAuth',
  services: {
    auth: () => ({
      currentUser: () => ({ id: 'u1', name: 'Chris' }),
    }),
  },
  server: {
    api: {
      '/api/me': ({ services }) => services.auth.currentUser(),
    },
    actions: {
      refreshSession: ({ services }) => services.auth.currentUser(),
    },
  },
});

const ProfileButton = define({
  layers: { auth: AuthLayer } as const,
  script({ layers: { auth } }) {
    const user = auth.services.auth.currentUser();
    return { user };
  },
  template: ({ user }) => <button>{user.name}</button>,
});
```

El nombre de la capa puede seguir siendo único globalmente (`platformAuth`)
mientras el componente usa el nombre local que prefiera (`auth`). Eso mantiene
estable el grafo de la aplicación y legible la sintaxis del componente.

## Qué Lo Hace Valioso

- Arquitectura orientada a capacidades: autenticación, datos, analítica,
  feature flags y rutas de API se convierten en módulos explícitos de la
  aplicación en lugar de imports ocultos.
- Mejor DX de componentes: `define({ script, template })` mantiene la lógica y
  la UI cerca, mientras que `layers: { auth: AuthLayer }` evita búsquedas por
  cadena y el paso de props en cascada.
- Acceso tipado a servicios: `auth.services.auth` se infiere desde
  `defineLayer`; el componente no vuelve a declarar los tipos de servicio a
  mano.
- Potencia del lado del servidor: `server.api` y `server.actions` propiedad de
  la capa dan a Effuse una superficie de peticiones al estilo de Next sin
  separar las rutas de la capacidad que las implementa.
- Actualizaciones de grano fino: las señales hacen que los cambios de estado
  sean precisos en lugar de forzar el rerenderizado de un subárbol completo.
- Comprobabilidad en producción: los servicios de capa, los scripts de
  componente y las rutas de servidor pueden probarse por separado o en conjunto
  a través del mismo grafo de capas declarado.

## No Objetivos

- Effuse no debe copiar por volumen todas las funciones de cada framework.
- Effuse no debe ocultar dependencias de la aplicación tras variables globales
  ambientales.
- Effuse no debe exigir que quien escribe un componente conozca el nombre global
  interno de una capa cuando un alias local es más claro.
- Effuse no debe convertir las rutas de servidor en un sistema separado de las
  capacidades de la aplicación.

El objetivo es una superficie más pequeña que se componga en un modelo de
aplicación más potente.
