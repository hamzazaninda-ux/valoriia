import type { RequestHandler } from './$types';
import { POST as handleOrdersPost, GET as handleOrdersGet, PATCH as handleOrdersPatch, DELETE as handleOrdersDelete } from '../orders/+server';

export const POST: RequestHandler = handleOrdersPost;
export const GET: RequestHandler = handleOrdersGet;
export const PATCH: RequestHandler = handleOrdersPatch;
export const DELETE: RequestHandler = handleOrdersDelete;
