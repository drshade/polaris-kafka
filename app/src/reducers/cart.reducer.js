// import { CART } from '../actions/types';
// import { ADD_PRODUCT } from '../actions/cart.addProduct.action';

// // Hack
// let getCart = () => {
//     let cart = localStorage.getItem('cart');
  
//     if (cart === null || cart === undefined || cart === 'undefined') {
//       console.log("catalogeReducer => no product");
//       cart = {
//         products: [],
//         qty: 0,
//         subTotal: 0
//       };
//     }
//     else {
//       try {
//         cart = JSON.parse(cart);
//       } catch (e) {
//         console.log("CANNOT parse product");
//       }
//     };
  
//     return cart;
//   };

// const initialState = getCart();

// export const cart = (state = initialState, event) => {
//     if (event.type !== CART) return state;  

//     switch (event.action) {
//         case ADD_PRODUCT:
//             let newState = {
//                 ...state,
//                 qty: state.qty + 1,
//                 subTotal: state.subTotal + parseFloat(event.data.product.price)
//             }

//             const newProduct = { 
//                 id: parseInt(event.data.product.id),
//                 sku: event.data.product.sku,
//                 price: event.data.product.price,
//                 stock: event.data.product.stock,
//                 imgUrl: event.data.product.imgUrl,
//                 description: event.data.product.description,                 
//                 qty: 1 };

//             //console.log(JSON.stringify(newProduct));

//             const existingProduct = newState.products.find(product => (product.id === parseInt(newProduct.id)));

//             if (existingProduct !== undefined) {
//                 newProduct.qty += existingProduct.qty;
//                 newState.products.splice(newState.products.indexOf(existingProduct), 1);
//                 newState.products.push(newProduct);
//             } else {
//                 newState.products.push(newProduct);
//             }

//             localStorage.setItem('cart', JSON.stringify(newState))

//             return newState;
      
//         default:
//             return state;
//     }
// };
