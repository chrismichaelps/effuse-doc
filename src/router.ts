import {
  createRouter,
  createWebHistory,
  defineRoutes,
} from '@effuse/router';
import { HomePage } from './pages/Home';
import { FormDemoPage } from './pages/Form';
import { TodosPage } from './pages/Todos';
import { PropsPage } from './pages/Props';
import { DocsPage } from './pages/Docs';
import { TermsPage } from './pages/Terms';
import { DisclaimerPage } from './pages/Disclaimer';
import { PrivacyPage } from './pages/Privacy';
import { ContactPage } from './pages/Contact';
import { NotFoundPage } from './pages/NotFound';
import { I18nPage } from './pages/I18n';
import { AboutPage } from './pages/About';
import { EmitDemoPage } from './pages/Emit';
import { ContextPage } from './pages/Context';
import { ComponentsPage } from './pages/Components';
import { ReleasesPage } from './pages/Releases';
import { RefsPage } from './pages/Refs';

const routes = defineRoutes([
  { path: '/', name: 'home', component: HomePage },
  { path: '/terms', name: 'terms', component: TermsPage },
  { path: '/privacy', name: 'privacy', component: PrivacyPage },
  { path: '/contact', name: 'contact', component: ContactPage },
  { path: '/disclaimer', name: 'disclaimer', component: DisclaimerPage },
  { path: '/docs', name: 'docs', component: DocsPage },
  { path: '/docs/:slug', name: 'docs-page', component: DocsPage },
  { path: '/about', name: 'about', component: AboutPage },
  { path: '/form', name: 'form-demo', component: FormDemoPage },
  { path: '/todos', name: 'todos', component: TodosPage },
  { path: '/props', name: 'props', component: PropsPage },
  { path: '/i18n', name: 'i18n', component: I18nPage },
  { path: '/emit', name: 'emit-demo', component: EmitDemoPage },
  { path: '/context', name: 'context-demo', component: ContextPage },
  { path: '/components', name: 'components-demo', component: ComponentsPage },
  { path: '/releases', name: 'releases', component: ReleasesPage },
  { path: '/refs', name: 'refs', component: RefsPage },
  { path: '*', name: 'not-found', component: NotFoundPage },
]);

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
