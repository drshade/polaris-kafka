import { NAVIGATION } from '../actions/types';
import { TOGGLE_HOME } from '../actions/navigation.toggleHome.action';

const initialState = {
    isHome: true
};

export const navigation = (state = initialState, event) => {
    if (event.type !== NAVIGATION) return state;  

    switch (event.action) {
        case TOGGLE_HOME:
            return { ...state, isHome: !state.isHome };
      
        default:
            return state;
    }
};
