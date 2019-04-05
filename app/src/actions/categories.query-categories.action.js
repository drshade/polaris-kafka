import { CATEGORIES as type } from "./types";

export const QUERY_CATEGORIES = "QUERY_CATEGORIES";

let url;
if (process.env.NODE_ENV === "production") {
  url = "https://d289thuiw7n9ug.cloudfront.net/categories.json";
} else {
  url = "categories.json";
}

export const queryCategories = () => {
  return (dispatch) => {
    return fetch(url)
      .then(resp => resp.json(), err => console.log(err))
      .then(categories => {
        const event = {
            type,
            action: QUERY_CATEGORIES,
            data: [{ ...categories }] //I'm doing this for now to simulate us getting mutliple different categories.
        };
        dispatch(event);
      });
  };
};
