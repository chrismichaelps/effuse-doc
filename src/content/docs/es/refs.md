---
title: Refs y Acceso al DOM
---

# Refs y Acceso al DOM

Aunque el modelo declarativo de Effuse maneja la mayoría de las actualizaciones del DOM automáticamente, a veces necesitas acceso directo a los elementos subyacentes—por ejemplo, para manejar el enfoque, reproducir medios o integrar bibliotecas de terceros. Effuse proporciona dos formas de manejar refs: **Objetos Ref** y **Callbacks de Ref**.

## Objetos Ref

La función `createRef` crea un objeto ref mutable que puede contener un elemento del DOM.

```tsx
import { createRef, onMount } from '@effuse/core';

const MyComponent = define({
	script: () => {
		// Crear una ref tipada
		const inputRef = createRef<HTMLInputElement>();

		onMount(() => {
			// Acceder al elemento via .current
			inputRef.current?.focus();
		});

		return { inputRef };
	},
	template: ({ inputRef }) => <input ref={inputRef} />,
});
```

### Suscripciones Reactivas

A diferencia de las refs estándar en otros frameworks, `createRef` de Effuse te permite **suscribirte** a cambios. Esto es útil para rastrear cuándo se monta o desmonta un elemento.

```tsx
const boxRef = createRef<HTMLDivElement>();

// El callback se dispara cuando el elemento cambia (se monta/desmonta)
boxRef.subscribe((el) => {
	if (el) {
		console.log('Elemento montado:', el);
		// Puedes adjuntar observadores aquí (ej: ResizeObserver)
	} else {
		console.log('Elemento desmontado');
	}
});
```

## Callbacks de Ref

Para un control más granular, puedes pasar una función directamente al atributo `ref`. Esta función se llama con el elemento del DOM cuando se monta, y con `null` cuando se desmonta.

```tsx
import type { RefCallback } from '@effuse/core';

const handleInputRef: RefCallback<HTMLInputElement> = (el) => {
	if (el) {
		console.log('Input montado');
		el.focus();
	}
};

// En el template:
<input ref={handleInputRef} />;
```

## Buenas Prácticas

- **Evita el uso excesivo**: Usa refs solo para acciones imperativas (enfoque, scroll, reproducción) o mediciones.
- **Limpieza**: Si adjuntas event listeners u observadores en un callback de ref o suscripción, asegúrate de limpiarlos adecuadamente.
