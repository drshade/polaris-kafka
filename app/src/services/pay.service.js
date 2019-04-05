import { send } from './socket';

export const pay = (data) => send(data.type, data.action, data);
