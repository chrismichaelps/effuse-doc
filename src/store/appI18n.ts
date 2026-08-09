import { createI18n } from '@effuse/i18n';
import { computed, signal } from '@effuse/core';
import enTranslations from '../locales/en.json';
import esTranslations from '../locales/es.json';
import jaTranslations from '../locales/ja.json';
import zhTranslations from '../locales/zh.json';

export const LOCALES = {
  EN: 'en',
  ES: 'es',
  JA: 'ja',
  ZH: 'zh',
} as const;

export type Locale = (typeof LOCALES)[keyof typeof LOCALES];

export interface AppTranslations {
  nav: {
    home: string;
    docs: string;
    about: string;
    examples: string;
    github: string;
  };
  sidebar: {
    gettingStarted: string;
    introduction: string;
    quickStart: string;
    installation: string;
    coreConceptsTitle: string;
    components: string;
    reactivity: string;
    lifecycle: string;
    advancedTitle: string;
    routing: string;
    server: string;
    cli: string;
    utilityHooks: string;
    stateManagement: string;
    seoHead: string;
    internationalization: string;
    examplesTitle: string;
    form: string;
    todos: string;
    props: string;
    i18n: string;
    emit: string;
    events: string;
    errorHandling: string;
    context: string;
    hooks: string;
    layers: string;
    controlFlow: string;
    repeat: string;
    await: string;
    refs: string;
    releases: string;
    ecosystem: string;
  };
  toc: {
    onThisPage: string;
  };
  footer: {
    builtWith: string;
  };
  search: {
    placeholder: string;
    startTyping: string;
    searchAcross: string;
    noResults: string;
    tryDifferent: string;
    toNavigate: string;
    toSelect: string;
    poweredBy: string;
    documentation: string;
    resultCode: string;
    resultTitle: string;
    resultSection: string;
    poweredByPrefix: string;
    poweredBySuffix: string;
  };
  about: {
    title: string;
    description: string;
    sections: {
      title: string;
      description: string;
    }[];
    sponsor: string;
    name: string;
    role: string;
    location: string;
    languages: string;
    projects: string[];
    focusTitle: string;
    meta: {
      title: string;
      description: string;
    };
  };
  notFound: {
    code: string;
    title: string;
    description: string;
    track: string;
    goHome: string;
    meta: {
      title: string;
      description: string;
    };
  };
  language: {
    selectLanguage: string;
    english: string;
    spanish: string;
    japanese: string;
    mandarin: string;
  };
  examples: {
    form: {
      title: string;
      description: string;
      createPost: string;
      apiNote: string;
      titleLabel: string;
      emailLabel: string;
      bodyLabel: string;
      userIdLabel: string;
      enterTitlePlaceholder: string;
      emailPlaceholder: string;
      bodyPlaceholder: string;
      required: string;
      valid: string;
      invalid: string;
      state: string;
      modified: string;
      pristine: string;
      submitting: string;
      yes: string;
      no: string;
      createButton: string;
      submittingButton: string;
      reset: string;
      createdPosts: string;
      loadingPosts: string;
      noPosts: string;
      user: string;
      howItWorks?: string;
    };
    todos: {
      title: string;
      description: string;
      enterTodoTitlePlaceholder: string;
      addPlaceholder: string;
      add: string;
      adding: string;
      total: string;
      completed: string;
      pending: string;
      all: string;
      edit: string;
      delete: string;
      editTodo: string;
      todoTitle: string;
      cancel: string;
      saveChanges: string;
      loadingTodos: string;
      noTodos: string;
      loadMore: string;
      loadingMore: string;
      refreshing: string;
      user: string;
      howItWorks?: string;
    };
    props: {
      title: string;
      description: string;
      parentControls: string;
      incrementCount: string;
      changeColor: string;
      toggleStatus: string;
      reset: string;
      currentCount: string;
      derivedValue: string;
      currentColor: string;
      activeStatus: string;
      active: string;
      inactive: string;
      triggerUpdate: string;
      howItWorks: string;
    };
    i18n: {
      title: string;
      description: string;
      welcome: string;
      currentLocale: string;
      changeLocale: string;
      greeting: string;
      featuresTitle: string;
      featuresTypeSafe: string;
      featuresInterpolation: string;
      featuresReactive: string;
      featuresNested: string;
      itemsOne: string;
      itemsOther: string;
      summary: string;
      yourName: string;
      footer: string;
      howItWorks?: string;
    };
    emit: {
      title: string;
      description: string;
      placeholder: string;
      send: string;
      actingAs: string;
      stats: {
        messages: string;
        emits: string;
        online: string;
      };
      reset: string;
      noMessages: string;
      howItWorks: string;
      mention: string;
      sessionStarted: string;
      switchedTo: string;
    };
    context: {
      title: string;
      description: string;
      themeSwitcher: string;
      themeSwitcherDesc: string;
      changeTheme: string;
      nestedOverride: string;
      nestedProviderTitle: string;
      nestedProviderDesc: string;
      root: string;
      nested: string;
      howItWorks: string;
      card1: string;
      card2: string;
      card3: string;
      card4: string;
      codeSnippet: string;
    };
    refs: {
      title: string;
      description: string;
      createRefDemo: string;
      createRefDesc: string;
      callbackRefDemo: string;
      callbackRefDesc: string;
      subscriptionDemo: string;
      subscriptionDesc: string;
      dimensions: string;
      width: string;
      height: string;
      focusInput: string;
      clickCount: string;
      reset: string;
      howItWorks: string;
      toggleElement: string;
      resizeMe: string;
      subscribeCallbacks: string;
      typePlaceholder: string;
      codeSnippet: string;
    };
    controlFlow: {
      title: string;
      description: string;
      show: {
        title: string;
        description: string;
        login: string;
        logout: string;
        pleaseLogin: string;
        welcome: string;
      };
      switch: {
        title: string;
        description: string;
        idle: string;
        loading: string;
        success: string;
        error: string;
      };
      for: {
        title: string;
        description: string;
        addPlaceholder: string;
        add: string;
        noItems: string;
      };
      dynamic: {
        title: string;
        description: string;
        changeColor: string;
        current: string;
      };
      repeat: {
        title: string;
        description: string;
        skeletonItems: string;
        currentCount: string;
        noItems: string;
        item: string;
      };
      await: {
        title: string;
        description: string;
        fetchUser: string;
        fetchNewUser: string;
        loading: string;
        errorMessage: string;
        retry: string;
        userName: string;
        userEmail: string;
        userId: string;
      };
    };
  };
  legal: {
    terms: {
      title: string;
      lastUpdated: string;
      sections: {
        acceptance: { title: string; content: string };
        license: { title: string; content: string };
        usage: {
          title: string;
          content: string;
          list: string[];
        };
        disclaimer: { title: string; content: string };
        liability: { title: string; content: string };
        changes: { title: string; content: string };
        contact: { title: string; content: string };
      };
      meta: { title: string; description: string };
    };
    privacy: {
      title: string;
      lastUpdated: string;
      sections: {
        overview: { title: string; content: string };
        collection: { title: string; content: string };
        cookies: { title: string; content: string };
        services: { title: string; content: string };
        contact: { title: string; content: string };
      };
      meta: { title: string; description: string };
    };
    disclaimer: {
      title: string;
      sections: {
        experimental: { title: string; content: string };
        competitor: {
          title: string;
          content1: string;
          content2: string;
        };
        risk: { title: string; content: string };
      };
      meta: { title: string; description: string };
    };
    contact: {
      title: string;
      content: string;
      meta: { title: string; description: string };
    };
  };
}

export type Translations = AppTranslations;

export const isLocale = (value: string): value is Locale =>
  Object.values(LOCALES).some((locale) => locale === value);

const normalizeLocale = (value: string): Locale =>
  isLocale(value) ? value : LOCALES.EN;

const translationsByLocale = {
  [LOCALES.EN]: enTranslations,
  [LOCALES.ES]: esTranslations,
  [LOCALES.JA]: jaTranslations,
  [LOCALES.ZH]: zhTranslations,
} satisfies Record<Locale, AppTranslations>;

const i18n = createI18n<AppTranslations>({
  defaultLocale: LOCALES.EN,
  fallbackLocale: LOCALES.EN,
  detectLocale: true,
  persistLocale: true,
  translations: translationsByLocale,
});

const translations = signal<AppTranslations | null>(
  translationsByLocale[normalizeLocale(i18n.getLocale())]
);

export const i18nStore = {
  locale: computed<Locale>(() => normalizeLocale(i18n.locale.value)),
  translations,
  isLoading: signal<boolean>(false),
  setLocale: async (loc: Locale) => {
    await i18n.setLocale(loc);
    translations.value = translationsByLocale[loc];
  },
  init: () => {
    translations.value =
      translationsByLocale[normalizeLocale(i18n.getLocale())];
  },
  t: i18n.t,
};

export { i18n };
