const LOCAL_REGEX = /^0[567]\d{8}$/;
const INTL_REGEX = /^(?:\+212|00212|212)[567]\d{8}$/;

export function isValidMoroccanPhone(phone: string): boolean {
	const clean = phone.replace(/[\s\-()]/g, '');
	return LOCAL_REGEX.test(clean) || INTL_REGEX.test(clean);
}
