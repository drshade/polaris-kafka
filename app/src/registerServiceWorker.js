import store from './store';
import { subscribe } from './actions/notification.subscribe.action';

const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    navigator.serviceWorker
      .register(swUrl)
      .catch((error) => {
        console.error('Error during service worker registration:', error);
      });

      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
  }
}

export function subscribeToPushNotifications() {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration(swUrl).then((registration) => {
      registration.pushManager
        .subscribe({
          userVisibleOnly: true
        })
        .then((subscription) => {
          console.log('User is subscribed to notifications:', subscription.endpoint);
          store.dispatch(subscribe(subscription.endpoint));
        })
        .catch((err) => {
          if (Notification.permission === 'denied') {
            console.warn('Permission for notifications was denied');
          } else {
            console.error('Failed to subscribe the user: ', err);
          }
        });
    });
  }
}
