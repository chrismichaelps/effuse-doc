import {
  define,
  computed,
  type Signal,
  type ReadonlySignal,
} from '@effuse/core';
import type { i18nStore as I18nStoreType } from '../../store/appI18n';
import './styles.css';

interface EditTodoModalProps {
  isOpen: Signal<boolean>;
  title: Signal<string>;
  onTitleChange: (title: string) => void;
  onSave: () => void;
  onClose: () => void;
}

interface EditTodoModalExposed {
  t: ReadonlySignal<any>;
}

export const EditTodoModal = define<EditTodoModalProps, EditTodoModalExposed>({
  script: ({ useStore }) => {
    const i18nStore = useStore('i18n') as typeof I18nStoreType;
    const t = computed(() => i18nStore.translations.value?.examples?.todos);
    return {
      t,
    };
  },
  template: ({ t, props }) => {
    const { isOpen, title, onTitleChange, onSave, onClose } = props;
    if (!isOpen.value) return null;
    return (
      <div class="edit-todo-modal-shell fixed inset-0 z-50 flex items-center justify-center">
        <div class="edit-todo-backdrop" onClick={() => onClose()} />

        <section
          class="edit-todo-dialog relative rounded-2xl w-full max-w-md mx-4 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-todo-title"
        >
          <header class="edit-todo-header px-6 py-4">
            <h2 id="edit-todo-title" class="text-xl font-semibold">
              {t.value?.editTodo}
            </h2>
          </header>

          <div class="p-6">
            <label class="edit-todo-label block mb-2 text-sm font-medium">
              {t.value?.todoTitle}
            </label>
            <input
              type="text"
              value={title}
              onInput={(e: Event) =>
                onTitleChange((e.target as HTMLInputElement).value)
              }
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') onSave();
                if (e.key === 'Escape') onClose();
              }}
              class="edit-todo-input w-full px-4 py-3 rounded-lg focus:outline-none"
              placeholder={t.value?.enterTodoTitlePlaceholder ?? ''}
            />
          </div>

          <footer class="edit-todo-footer px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onClose()}
              class="edit-todo-cancel px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t.value?.cancel}
            </button>
            <button
              type="button"
              onClick={() => onSave()}
              class="edit-todo-save px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {t.value?.saveChanges}
            </button>
          </footer>
        </section>
      </div>
    );
  },
});
