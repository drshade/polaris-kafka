import React, { Component } from 'react';
import { connect } from 'react-redux';
import './MoneyTicker.css';
import store from '../../store';
import { updatePreviousBalance } from '../../actions/wallet.updatePreviousBalance.action';

let getBalance = () => {
  let balance = localStorage.getItem('balance');

  if (balance === null || balance === undefined || balance === 'undefined') {
    balance = 0;
  }

  return Number(balance);
};

let setBalance = (balance) => localStorage.setItem('balance', balance);

class MoneyTicker extends Component {
  state = {};
  balanceRef = React.createRef();
  previousBalanceRef = React.createRef();

  componentDidMount() {
    // let balance = getBalance();

    // this.setState({
    //   previousBalance: balance,
    //   balance
    // });
  }

  componentDidUpdate(prevProps) {
    // if (this.state.previousBalance != prevProps.balance) {
    if (this.props.previousBalance !== this.props.balance) {
      // this.setState({ previousBalance: prevProps.balance });
      this.changeBalance();
    }

    if (!isNaN(this.props.balance)) {
      setTimeout(() => {
        let balance = getBalance();

        if (balance !== this.props.balance) {
          setBalance(this.props.balance);
        }
      }, 1);
    }

  }

  changeBalance() {
    let cb = this.previousBalanceRef.current.children;
    let nb = this.balanceRef.current.children;

    for (let i = 0; i < cb.length; i++) {
      this.animateNumberOut(cb, i);
    }

    for (let i = 0; i < nb.length; i++) {
      nb[i].className = 'number behind';
      nb[0].parentElement.style.opacity = 1;

      this.animateNumberIn(nb, i);
    }

    setTimeout(() => store.dispatch(updatePreviousBalance()), 1000);
  }

  animateNumberOut(cb, i) {
    setTimeout(function() {
      if (cb[i]) {
        cb[i].className = 'number out';
      }
    }, i * 80);
  }

  animateNumberIn(nb, i) {
    setTimeout(function() {
      if (nb[i]) {
        nb[i].className = 'number in';
      }
    }, 340 + i * 80);
  }

  render() {
    let savedBalance = getBalance();

    let balance = this.props.balance;

    if (isNaN(balance)) {
      balance = savedBalance || 0;
    }

    balance = balance.toFixed(2);
    let previousBalance = (this.props.previousBalance || savedBalance).toFixed(2);

    // Todo: remove this when everything is working.
    console.log(`Previous: ${previousBalance}, Current: ${balance}`);

    let split = (balance) =>
      balance.split('').map((c, i) => (
        <span key={i} className="number">
          {c}
        </span>
      ));

    return (
      <div className="money-ticker">
        <div className="amount">
          <div className="value-wrapper">
            <div className="value current-balance" ref={this.balanceRef}>
              {split(balance)}
            </div>
            <div className="value previous-balance" ref={this.previousBalanceRef}>
              {split(previousBalance)}
            </div>
          </div>
          <sub className="currency">R</sub>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    previousBalance: state.wallet.previousBalance,
    balance: state.wallet.balance
  };
}

export default connect(mapStateToProps)(MoneyTicker);
