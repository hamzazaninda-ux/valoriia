/**
 * Cloudinary image optimization utility.
 * Injects f_auto, q_auto, and target width transformations right after `/image/upload/`.
 * Leaves non-Cloudinary images completely untouched.
 */
export function cloudinaryUrl(url: string | null | undefined, transform: string): string {
	if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
		return url || '';
	}
	// Avoid double transformations
	if (url.includes('/image/upload/f_auto') || url.includes('/image/upload/w_')) {
		return url;
	}
	return url.replace('/image/upload/', `/image/upload/${transform}/`);
}

/**
 * Builds responsive srcset string for Cloudinary images.
 */
export function cloudinarySrcset(
	url: string | null | undefined,
	widths: number[] = [480, 720, 960]
): string | undefined {
	if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
		return undefined;
	}
	return widths
		.map((w) => `${cloudinaryUrl(url, `f_auto,q_auto,w_${w}`)} ${w}w`)
		.join(', ');
}
