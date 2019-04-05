import { SESSION, ONBOARDING } from '../actions/types';
import { LOGIN } from '../actions/session.login.action';
import { LOGOUT } from '../actions/session.logout.action';
import { REGISTER } from "../actions/onboarding.register.action";
import { COMPLETED } from '../actions/onboarding.completed.action';

const initialState = {
  isLoggedIn: false
};

export const user = (state = initialState, event) => {
  if (event.type !== SESSION && event.type !== ONBOARDING) return state;

  switch (event.action) {
    case LOGIN:
      return { ...state, token: event.token, profile: event.profile, isLoggedIn: true };

    case LOGOUT:
      return { ...state, isLoggedIn: false, profile: undefined };

    case REGISTER:
      return { ...state, profile: event.profile };

    case COMPLETED:    
      return { ...state, profile: event.data };
      
    default:
      return state;
  }
};
