import { PRODUCT } from "../actions/types";

import { QUERY_PRODUCTS } from "../actions/product.query-products.action";
import { PRICE_UPDATED } from "../actions/product.price-updated.action";
import { STOCK_UPDATED } from "../actions/product.stock-updated.action";
import { SELECT_PRODUCT } from "../actions/product.select-product.action";
import { SORT_PRODUCTS } from "../actions/product.sort-products.action";
import { PRICE_FILTER } from "../actions/product.price-filter.action";

import { CART } from '../actions/types';
import { ADD_PRODUCT } from '../actions/cart.addProduct.action';

import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';

// Hack
let getSelectedProduct = () => {
  let product = localStorage.getItem("selectedProduct");

  if (product === null || product === undefined || product === "undefined") {
    product = {};
  } else {
    try {
      product = JSON.parse(product);
    } catch (e) {
      console.log("CANNOT parse product");
    }
  }

  return product;
};

// let getCart = () => {
//   let cart = localStorage.getItem('cart');

//   if (cart === null || cart === undefined || cart === 'undefined') {
//     cart = {
//       products: [],
//       qty: 0
//     };
//   }
//   else {
//     try {
//       cart = JSON.parse(cart);
//     } catch (e) {
//       console.log("CANNOT parse cart");
//     }
//   };

//   return cart;
// };

const persistConfig = {
  key: 'cart',
  storage: storage,
  whitelist: ['cart']
};


const initialState = {
  category: "all",
  products: [],
  stockLevels: [],
  selectedProduct: getSelectedProduct(),
  cart: {
    products: [],
    qty: 0
  },
  lastStockUpdatedId: 0,
  filter: {
    sortOrder: 0,
    minValue: 0,
    fixedMin: 0,
    maxValue: 0,
    fixedMax: 0,
  }
};

export const catalogue = persistReducer(persistConfig, (state = initialState, event) => {
  if (event.type !== PRODUCT && event.type !== CART) return state;

  const productId = parseInt(event.data.id);

  switch (event.action) {
    case QUERY_PRODUCTS: {
      return { 
        ...state, 
        products: event.data.products,
        filter: {
          ...state.filter,
          fixedMax: event.data.maxValue,
          maxValue: event.data.maxValue,
          fixedMin: event.data.minValue
        }
      };
    }
    case PRICE_UPDATED: {
      let newState = {
        ...state,
        products: state.products.map(product => {
          return product.id === productId
            ? { ...product, price: event.data.price }
            : product;
        })
      };

      // Update the selected product if it is the one selected.
      if (
        newState.selectedProduct !== null &&
        newState.selectedProduct !== "undefined"
      ) {
        if (newState.selectedProduct.id === productId) {
          newState.selectedProduct = {
            ...state.selectedProduct,
            price: event.data.price
          };
        }
      }

      // Update cart with the new stock (if it exists)
      newState.cart = {
        ...state.cart,          
        products: state.cart.products.map(product => {
          return product.id === productId
            ? { ...product, price: event.data.price }
            : product;
        })
      }

      //localStorage.setItem('cart', JSON.stringify(newState.cart))

      return newState;
    }
    case STOCK_UPDATED: {
      const productId = parseInt(event.data.id);

      let newState = {
        ...state,
        lastStockUpdatedId: productId
      };

      // Update the stock level which is displayed on the product catalogue.
      const existingStock = newState.stockLevels.find(
        stock => stock.id === productId
      );
      const newStock = {
        id: productId,
        quantity: event.data.qty,
        isAvailable: event.data.is_in_stock
      };

      if (existingStock !== undefined) {
        newState.stockLevels.splice(
          newState.stockLevels.indexOf(existingStock),
          1
        );
        newState.stockLevels.push(newStock);
      } else {
        newState.stockLevels.push(newStock);
      }

      // Update the selected product if it is the one selected.
      if (
        newState.selectedProduct !== null &&
        newState.selectedProduct !== "undefined"
      ) {
        if (newState.selectedProduct.id === newStock.id) {
          newState.selectedProduct = {
            ...newState.selectedProduct,
            stock: newStock
          };
        }
      }

      // Update cart with the new stock (if it exists)
      newState.cart = {
        ...state.cart,          
        products: state.cart.products.map(product => {
          return product.id === productId
            ? { ...product, stock: newStock }
            : product;
        })
      }     

      //localStorage.setItem('cart', JSON.stringify(newState.cart))

      return newState;
    }
    case SELECT_PRODUCT: {
      return {
        ...state,
        selectedProduct: event.data.selectedProduct
      };
    }
    case SORT_PRODUCTS: {
      return {
        ...state,
        filter: {
          ...state.filter,
          sortOrder: event.data.sortOrder
        }
      }
    }
    case PRICE_FILTER: {
      return {
        ...state,
        filter: {
          ...state.filter,
          minValue: event.data.minVal,
          maxValue: event.data.maxVal
        }
      }
    }
    case ADD_PRODUCT: {
      let newState = {
        ...state,
      }

      newState.cart = {
        ...newState.cart,
        qty: newState.cart.qty + 1       
      }

      const newProduct = { 
          id: parseInt(event.data.product.id),
          sku: event.data.product.sku,
          price: parseFloat(event.data.product.price),
          stock: event.data.product.stock,
          imgUrl: event.data.product.imgUrl,
          description: event.data.product.description,                 
          qty: 1 };

      //console.log(JSON.stringify(newProduct));

      const existingProduct = newState.cart.products.find(product => (product.id === productId));

      if (existingProduct !== undefined) {
          newProduct.qty += existingProduct.qty;
          newState.cart.products.splice(newState.cart.products.indexOf(existingProduct), 1);
          newState.cart.products.push(newProduct);
      } else {
          newState.cart.products.push(newProduct);
      }

      //localStorage.setItem('cart', JSON.stringify(newState.cart))

      return newState;
    }    
    default:
      return state;
  }
});
