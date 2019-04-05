import { PRODUCT as type } from './types';

export const QUERY_PRODUCTS = 'QUERY_PRODUCTS';

let url;
if (process.env.NODE_ENV === 'production') {
  url = 'https://d289thuiw7n9ug.cloudfront.net/products.json';
} else {
  url = '/products.json';
}

export const queryProducts = (categoryId) => {
  return (dispatch) => {
    return fetch(url)
      .then((resp) => resp.json(), (err) => console.log(err))
      .then((data) => {
        let maxValue = 0, minValue = 0;
        for (let i = 0; i < data.items.length; i++) {
          const price = data.items[i].price;
          if (maxValue < price) {
            maxValue = price;
          } else if (minValue > price) {
            minValue = price;
          }
        }
        
        //This is just filtering for now to simulate the product categories, hopefully they provide a better structure for us to load products.
        let items = [];
        data.items.forEach(product => {
          if (product.extension_attributes !== undefined && product.extension_attributes.category_links !== undefined) {
            const inCategory = product.extension_attributes.category_links.find(category => categoryId === parseInt(category.category_id));
            if (Boolean(inCategory)) {
              items.push(product);
            }
          }
        });

        let event = {
          type,
          action: QUERY_PRODUCTS,
          data: {
            products: items,
            minValue: minValue,
            maxValue: maxValue
          }
        };
        dispatch(event);
      });
  };
};
