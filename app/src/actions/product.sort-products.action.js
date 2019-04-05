import { PRODUCT as type } from './types';

export const SORT_PRODUCTS = 'SORT_PRODUCTS';

export const sortProducts = (order) => {
    return {
      type,
      action: SORT_PRODUCTS,
      data:{
          sortOrder: order
      }
    };
};