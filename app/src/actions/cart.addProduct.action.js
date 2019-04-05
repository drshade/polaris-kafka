import { CART as type } from './types';

export const ADD_PRODUCT = 'ADD_PRODUCT';

export const addProduct = (product) => {
    return {
      type,
      action: ADD_PRODUCT,
      data:{
          product
      }
    };
};