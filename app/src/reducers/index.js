import { connectRouter } from 'connected-react-router';

//import { combineReducers } from 'redux';
import { persistCombineReducers } from 'redux-persist';
import storage from 'redux-persist/lib/storage' // defaults to localStorage for web and AsyncStorage for react-native

import { user } from './user.reducer';
import { ping } from './ping.reducer';
import { wallet } from './wallet.reducer';
import { notification } from './notification.reducer';
import { catalogue } from './catalogue.reducer';
import { categories } from './categories.reducer';
//import { cart } from './cart.reducer';
import { navigation } from './navigation.reducer';
import { wishlist } from './wishlist.reducer';

// https://blog.reactnativecoach.com/the-definitive-guide-to-redux-persist-84738167975
const persistConfig = {
  key: 'root',
  storage,
  //blacklist: ["router", "user", "ping", "wallet", "notification", "catalogue", "navigation", "categories"]
  whitelist: ["wishlist"]
}

export default (history) =>
    persistCombineReducers(persistConfig, {
      router: connectRouter(history),
      user,
      ping,
      wallet,
      notification,
      catalogue,
      //cart,
      navigation,
      wishlist,
      categories
    });
