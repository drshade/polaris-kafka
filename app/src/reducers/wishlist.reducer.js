import { WISHLIST } from "../actions/types";
import { ADD_ITEM_TO_WISHLIST } from "../actions/wishlist.add-product.action";
import { REMOVE_ITEM_FROM_WISHLIST } from "../actions/wishlist.remove-product.action.js";

//Hack
// let getWishlist = () => {
//   let wishlist = localStorage.getItem("wishlist");

//   if (wishlist === null || wishlist === undefined || wishlist === "undefined") {
//     wishlist = {
//       products: []
//     };
//   } else {
//     try {
// 			wishlist = JSON.parse(wishlist);
//     } catch (e) {
//       console.log("Can not parse wishlist");
//     }
// 	}
// 	return wishlist;
// };

const initialState = {
	      products: []
	    };

export const wishlist = (state = initialState, event) => {
	if (event.type !== WISHLIST) return state;

	switch (event.action) {
		case ADD_ITEM_TO_WISHLIST: {
			let newState = {
				...state
			};

			//TODO: this will have to change to include the entire product to show it on the wishlist screen
			//			for a user.
			const newProduct = {
				id: parseInt(event.data.productId)
			};

			const existingProduct = newState.products.find(product => product.id === newProduct.id);
			if (existingProduct === undefined) {
				newState.products.push(newProduct);
			}

			//localStorage.setItem('wishlist', JSON.stringify(newState));
			return newState;
		}
		case REMOVE_ITEM_FROM_WISHLIST: {
			let newState = {
				...state
			};

			const existingProduct = newState.products.find(product => product.id === event.data.productId);
			if (existingProduct !== undefined) {
				newState.products.splice(newState.products.indexOf(existingProduct), 1);
			}
			//localStorage.setItem('wishlist', JSON.stringify(newState));
			return newState;
		}
		default: {
			return state;
		}
	}
}