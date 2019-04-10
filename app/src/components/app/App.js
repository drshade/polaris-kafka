import React, { Component } from 'react';
import { Route, Switch } from 'react-router';

import './App.css';

import OktaLogin from '../login/OktaLogin'
import OktaRedirect from '../login/OktaRedirect'
import Menu from '../menu/Menu';
import Home from '../home/Home';
import Register from '../register/Register';
import Unregister from '../unregister/Unregister';
import Otp from '../otp/Otp';
import AccountCreated from '../account-created/AccountCreated';
import Profile from '../profile/Profile';
import Scan from '../scan/Scan';
import Pay from '../pay/Pay';
import Receive from '../receive/Receive';
import ConfirmPayment from '../confirm-payment/ConfirmPayment';
import AddMoney from '../add-money/AddMoney';
import PaymentMethod from '../payment-method/PaymentMethod';
import NotificationPermission from '../notification-permission/NotificationPermission';

export default class App extends Component {
  state = {};

  render() {
    return (
      <div className="app">
        <Menu />
        <NotificationPermission />
        
        <div className="content">
          <Switch>
            <Route exact path="/" render={() => <Home />} />
            <Route path="/login" render={() => <OktaLogin />} />
            <Route path="/implicit/callback" render={() => <OktaRedirect />} />
            <Route path="/register" render={() => <Register />} />
            <Route path="/unregister" render={() => <Unregister />} />
            <Route path="/otp" render={() => <Otp />} />
            <Route path="/created" render={() => <AccountCreated />} />
            <Route path="/profile" render={() => <Profile />} />
            <Route path="/scan" render={() => <Scan />} />
            <Route path="/pay/:code" render={() => <Pay />} />
            <Route path="/confirm-payment/:reference" render={() => <ConfirmPayment />} />
            <Route path="/add-money" render={() => <AddMoney />} />
            <Route path="/payment-method" render={() => <PaymentMethod />} />
            <Route path="/receive" render={() => <Receive />} />
          </Switch>
        </div>
      </div>
    );
  }
}
