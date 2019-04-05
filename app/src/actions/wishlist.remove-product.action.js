import { WISHLIST as type } from './types';

export const REMOVE_ITEM_FROM_WISHLIST = "REMOVE_ITEM_FROM_WISHLIST";

export const removeProductFromWishlist = (productId) => {
    return {
        type,
        action: REMOVE_ITEM_FROM_WISHLIST,
        data: {
            productId: productId
        }
    };
}