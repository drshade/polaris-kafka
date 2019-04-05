import { WISHLIST as type} from './types';

export const ADD_ITEM_TO_WISHLIST = "ADD_ITEM_TO_WISHLIST";

export const addProductToWishlist = (id) => {
    return {
        type,
        action: ADD_ITEM_TO_WISHLIST,
        data: {
            productId: id
        }
    };
}