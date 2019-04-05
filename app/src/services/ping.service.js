import { send } from './socket';

export const ping = () => send('TEST', 'PING', {});
