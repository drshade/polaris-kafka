import store from '../store';
import { getToken } from './token.service';

const endpoint = 'wss://wakanda.p1.s7s.cloud/wakanda/ws/updates';
// const endpoint = 'ws://localhost:8080/wakanda/ws/updates';

let init = () => {
  let socket = new WebSocket(endpoint);

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // Refactor.
    if (data instanceof Array) {
      data.forEach((update) => {
        store.dispatch(update);
      });
    } else {
      store.dispatch(data);
    }
  };

  socket.onclose = (event) => {
    console.log('Websocket has disconnected, trying to reconnect.');
    setTimeout(() => {
      s = init();
      
      // This is a hack, sorry. :(
      send('SESSION', 'LOGIN', {});

    }, 1000);
  };

  socket.onopen = (event) => {
    console.log('Socket opened');
  };

  socket.onerror = (error) => {
    console.error(error);
  };

  return socket;
};

let s = init();

const send = (type, action, data) => {
  // console.log(`Trying to send, (type: ${type}, action: ${action})`);
  if (s.readyState !== 1) {
    setTimeout(() => send(type, action, data), 10);
    return;
  }

  const auth = getToken();
  s.send(JSON.stringify({ type, action, auth, data }));
};

export { send };
