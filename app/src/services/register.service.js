import { send } from './socket';

export const register = (profile) => {
  send('ONBOARDING', 'REGISTER', profile);
};

export const unregister = () => {
  send('ONBOARDING', 'UNREGISTER', {});
};