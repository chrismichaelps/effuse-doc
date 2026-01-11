import { defineHook, type Signal } from '@effuse/core';

interface TocItem {
	id: string;
	title: string;
}

interface ScrollSpyConfig {
	containerSelector: string;
	threshold: number;
}

interface ScrollSpyReturn {
	activeId: Signal<string>;
	items: Signal<TocItem[]>;
	setItems: (newItems: TocItem[]) => void;
	setActiveId: (id: string) => void;
	init: () => void;
}

export const useScrollSpy = defineHook<ScrollSpyConfig, ScrollSpyReturn>({
	name: 'useScrollSpy',
	setup: ({ config, signal, effect }): ScrollSpyReturn => {
		const activeId = signal('');
		const items = signal<TocItem[]>([]);
		const initialized = signal(false);

		let scrollLocked = false;
		let lockTimeout: ReturnType<typeof setTimeout> | null = null;

		effect(() => {
			if (!initialized.value) return undefined;

			const container = document.querySelector(config.containerSelector);
			if (!container) return undefined;

			const handleScroll = () => {
				if (scrollLocked) return;

				const tocItems = items.value;
				if (tocItems.length === 0) return;

				let foundId = '';
				for (const item of tocItems) {
					let el = document.getElementById(item.id);
					if (!el) {
						const headings = document.querySelectorAll('h1, h2, h3');
						for (const h of headings) {
							if (h.textContent?.trim() === item.title) {
								el = h as HTMLElement;
								break;
							}
						}
					}
					if (el) {
						const rect = el.getBoundingClientRect();
						if (rect.top < config.threshold) {
							foundId = item.id;
						}
					}
				}

				const scrollTop = window.scrollY || document.documentElement.scrollTop;
				const scrollHeight = document.documentElement.scrollHeight;
				const clientHeight = window.innerHeight;
				if (scrollTop + clientHeight >= scrollHeight) {
					foundId = tocItems[tocItems.length - 1]?.id || foundId;
				}

				activeId.value = foundId || tocItems[0]?.id || '';
			};

			container.addEventListener('scroll', handleScroll, { passive: true });
			window.addEventListener('scroll', handleScroll, { passive: true });

			requestAnimationFrame(() => {
				const tocItems = items.value;
				if (tocItems.length > 0) {
					activeId.value = tocItems[0].id;
				}
				handleScroll();
			});

			return () => {
				container.removeEventListener('scroll', handleScroll);
				window.removeEventListener('scroll', handleScroll);
				if (lockTimeout) clearTimeout(lockTimeout);
			};
		});

		return {
			activeId,
			items,
			setItems: (newItems: TocItem[]) => {
				items.value = newItems;
			},
			setActiveId: (id: string) => {
				scrollLocked = true;
				if (lockTimeout) clearTimeout(lockTimeout);
				lockTimeout = setTimeout(() => {
					scrollLocked = false;
				}, 1500);
				activeId.value = id;
			},
			init: () => {
				initialized.value = true;
			},
		};
	},
});
