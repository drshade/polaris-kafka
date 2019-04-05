import React, { Component } from 'react';

import './Wallet.css';

import { connect } from 'react-redux';
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
