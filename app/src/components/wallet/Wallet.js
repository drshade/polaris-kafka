import React, { Component } from 'react';

import './Wallet.css';

import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import MoneyTicker from '../money-ticker/MoneyTicker';

let useMoneyTicker = true;

class Wallet extends Component {
  state = {};

  render() {
    let balance = this.props.balance || 0;

    return (
      <div className="wallet">
        <div className="money">
          <div className="balance">
            <div className="description">Available Balance</div>
            {useMoneyTicker ? (
              <MoneyTicker />
            ) : (
              <div className="currency-label-wrapper">
                <div className="amount">
                  <sub className="currency">R</sub>
                  <div className="value">{balance.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>
          <div className="add-money">
            <Link to="/add-money">
              <img src="/assets/images/money-bag.svg" alt="add-money" />
              Add Money
            </Link>
          </div>
        </div>
        <div className="buttons">
          <Link to="/scan">
            <img src="/assets/images/mobile-pay.svg" alt="mobile-pay" />
            Pay
          </Link>
          <Link to="/receive">
            <img src="/assets/images/receive.svg" alt="receive" />
            Receive Money
          </Link>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    balance: state.wallet.balance
  };
}

export default connect(mapStateToProps)(Wallet);
