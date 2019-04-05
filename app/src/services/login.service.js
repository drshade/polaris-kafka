import { send } from './socket';
import { setToken } from './token.service';

export const login = (token) => {
  setToken(token);

  console.info('Token: ', token);

  send('SESSION', 'LOGIN', {});
};
