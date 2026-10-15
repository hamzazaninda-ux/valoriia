export * from './pixel.js';

export const fbqTrack = (event: string, data?: any): void => {
	if (typeof window !== 'undefined' && typeof (window as any).fbq === 'function') {
		(window as any).fbq('track', event, data);
	}
};
