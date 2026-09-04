import { writable } from 'svelte/store';

export interface Toast {
	id: number;
	message: string;
	type: 'success' | 'error' | 'info';
	duration: number;
}

let counter = 0;

function createToastStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		success(message: string, duration = 3000) {
			const id = ++counter;
			update(toasts => [...toasts, { id, message, type: 'success', duration }]);
		},
		error(message: string, duration = 4000) {
			const id = ++counter;
			update(toasts => [...toasts, { id, message, type: 'error', duration }]);
		},
		info(message: string, duration = 3000) {
			const id = ++counter;
			update(toasts => [...toasts, { id, message, type: 'info', duration }]);
		},
		remove(id: number) {
			update(toasts => toasts.filter(t => t.id !== id));
		}
	};
}

export const toasts = createToastStore();
