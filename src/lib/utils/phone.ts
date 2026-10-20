const LOCAL_REGEX = /^0[567]\d{8}$/;
const INTL_REGEX = /^(?:\+212|00212|212)[567]\d{8}$/;

export function isValidMoroccanPhone(phone: string): boolean {
	const clean = phone.replace(/[\s\-()]/g, '');
	return LOCAL_REGEX.test(clean) || INTL_REGEX.test(clean);
}

/**
 * 1. Phone Formatter: Always enforce '212' country code without '+' or leading '0'
 * Returns clean digits e.g. 212666666666
 */
export function formatMoroccanPhone(rawPhone: any): string {
	if (!rawPhone) return '';
	let clean = String(rawPhone).replace(/[^0-9]/g, '');
	if (clean.startsWith('0')) {
		clean = '212' + clean.substring(1);
	} else if (!clean.startsWith('212')) {
		clean = '212' + clean;
	}
	return clean; // e.g. 212666666666
}
