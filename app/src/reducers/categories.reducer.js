import { CATEGORIES as type } from "../actions/types";

import { QUERY_CATEGORIES } from "../actions/categories.query-categories.action";

const initialState = {
  categories: []
};

export const categories = (state = initialState, event) => {
  if (event.type !== type) return state;

  switch (event.action) {
		case QUERY_CATEGORIES: {
			return {
				...state,
				categories: event.data
			};
		}
		default: {
			return state;
		}
  }
};
