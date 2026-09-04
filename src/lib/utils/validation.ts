import { isValidMoroccanPhone } from './phone';

export interface FormErrors {
	fullName: string;
	city: string;
	phoneNumber: string;
}

export function validateOrderForm(
	fullName: string,
	city: string,
	phoneNumber: string
): { errors: FormErrors; shouldShake: boolean } {
	const errors: FormErrors = {
		fullName: '',
		city: '',
		phoneNumber: ''
	};
	let shouldShake = false;

	if (!fullName.trim()) {
		errors.fullName = 'الاسم الكامل مطلوب لتأكيد الطلب';
	}

	if (!city.trim()) {
		errors.city = 'يرجى إدخال اسم المدينة';
	}

	if (!phoneNumber.trim()) {
		errors.phoneNumber = 'رقم الهاتف مطلوب لتأكيد الطلب';
		shouldShake = true;
	} else if (!isValidMoroccanPhone(phoneNumber.trim())) {
		errors.phoneNumber = 'رقم الهاتف الذي أدخلتموه غير صحيح';
		shouldShake = true;
	}

	const hasErrors = !!(errors.fullName || errors.city || errors.phoneNumber);
	return { errors, shouldShake: hasErrors ? shouldShake : false };
}
