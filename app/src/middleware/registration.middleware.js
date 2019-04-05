import { ONBOARDING } from '../actions/types';
import { REQUIRED } from '../actions/onboarding.required.action';
import { push } from 'connected-react-router';

export const registrationMiddleware = (store) => (next) => (event) => {
  if (event.type === ONBOARDING && event.action === REQUIRED) {
    store.dispatch(push('/register'));
  }

  return next(event);
};
