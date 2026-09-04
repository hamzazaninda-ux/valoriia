export function formatPrice(price: number, currencySymbol: string): string {
	return `${price} ${currencySymbol}`;
}

export function buildWhatsappUrl(whatsappNumber: string, productName: string): string {
	const cleanNum = whatsappNumber.replace(/[^0-9]/g, '');
	const message = encodeURIComponent(`مرحباً، أريد طلب ${productName}`);
	return `https://wa.me/${cleanNum}?text=${message}`;
}
