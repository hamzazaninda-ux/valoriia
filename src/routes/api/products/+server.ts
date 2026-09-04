import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listProducts } from '$lib/content/products';
import type { ProductIndex } from '$lib/types/product';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const products: ProductIndex = await listProducts();

    const statusFilter = url.searchParams.get('status')?.toLowerCase();
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20', 10) || 20));

    let filtered = products;
    if (statusFilter && statusFilter !== 'all') {
      filtered = products.filter(p => p.status === statusFilter);
    }

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const data = filtered.slice(offset, offset + limit);

    const response = json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      meta: {
        statusFilter: statusFilter || 'all',
        totalProducts: products.length
      }
    });

    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=60');
    response.headers.set('Surrogate-Control', 'max-age=60');

    return response;
  } catch (err) {
    console.error('Failed to list products:', err);
    return json(
      { error: 'Failed to list products', data: [], pagination: null, meta: null },
      { status: 500 }
    );
  }
};
