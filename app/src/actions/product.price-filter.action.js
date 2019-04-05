import { PRODUCT as type } from './types';

export const PRICE_FILTER = 'PRICE_FILTER';

export const filterProductsByPrice = (minVal, maxVal) => {
    return {
      type,
      action: PRICE_FILTER,
      data:{
        minVal: minVal,
        maxVal: maxVal
      }
    };
};