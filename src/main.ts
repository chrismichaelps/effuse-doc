import { createApp } from '@effuse/core';
import { App } from './App';
import { clientLayers } from './layers/client-layers';
import './styles.css';

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
