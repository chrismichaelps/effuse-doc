import { createApp, initHydration } from '@effuse/core';
import { App } from './App';
import { clientLayers } from './layers/client-layers';
import './styles.css';

// Adopt the server-rendered head, then discard the server-rendered body.
//
// mount() always builds fresh DOM and has no hydration mode, so leaving the
// server markup in place renders the whole application a second time beside
// it -- duplicate ids, doubled layer setup, and inert event handlers on the
// first copy. Clearing the container keeps the crawler-visible first paint
// while the client owns a single live tree. Replace this with a real
// hydration call once chrismichaelps/effuse#432 lands.
initHydration();

const container = document.querySelector('#app');
if (container) container.replaceChildren();

createApp(App)
  .useLayers(clientLayers)

  .then((app) => {
    app
      .mount('#app', {
        tracing: {
          enabled: import.meta.env.DEV,
          serviceName: 'effuse-app',
          console: true,
          verbose: true,
          categories: {
            layers: true,
            router: true,
            components: true,
            effects: true,
            signals: false,
            suspense: true,
            emit: true,
            store: true,
            fibers: true,
            hooks: true,
          },
        },
      })
      .then(() => console.log('[App] mounted'))
      .catch((err) => console.error('[App] mount failed', err));
  });
