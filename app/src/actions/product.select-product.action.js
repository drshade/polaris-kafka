import { PRODUCT as type } from './types';

export const SELECT_PRODUCT = 'SELECT_PRODUCT';

export const selectProduct = (product) => {
    return {
      type,
      action: SELECT_PRODUCT,
      data:{
          selectedProduct: product
      }
    };
};