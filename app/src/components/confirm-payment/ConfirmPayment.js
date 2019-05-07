import React, { Component } from 'react';
import { matchPath } from 'react-router-dom';
import { CircularProgress, Link, Button } from '@material-ui/core';
import { push } from 'connected-react-router';

import CheckCircleRoundedIcon from '@material-ui/icons/CheckCircleRounded';

import './ConfirmPayment.css';
import store from '../../store';
import { connect } from 'react-redux';
import { queryPayment } from '../../actions/wallet.query-payment';

class ConfirmPayment extends Component {
  state = {
    payment: {
      inProgress: true,
      waiting: true
    }
  };
  componentWillMount() {
    if (!this.props.payment) {
      store.dispatch(queryPayment(this.props.reference));
    }
  }

  done() {
    store.dispatch(push('/'));
  }

  render() {
    const { inProgress, waiting, amount, to, description } =
      this.props.payment || this.state.payment;
    const balance = this.props.balance;

    return (
      <div>
        <div className="top">
          <div className="indicator">
            {inProgress ? (
              <CircularProgress className="pending" />
            ) : (
              <CheckCircleRoundedIcon className="check" />
            )}
          </div>

          <h2>{inProgress ? 'In progress' : 'Successful!'}</h2>

          {!waiting && (
            <div>
              <div className="currency-label-wrapper">
                <div className="amount">
                  <sub className="currency">R</sub>
                  <div className="value">{amount.toFixed(2)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="bottom">
          <h2 className="description">Updated balance</h2>

          <div className="currency-label-wrapper">
            <div className="amount">
              <strong>R{balance.toFixed(2)}</strong>
            </div>
          </div>

          <Link color="primary" href="/add-money">
            + Add money
          </Link>

          <div className="button-container">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={(e) => this.done()}
              disabled={inProgress}
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const match = matchPath(state.router.location.pathname, {
    path: '/confirm-payment/:reference'
  });
  const reference = match.params.reference;

  let payment;
  if (state.wallet && state.wallet.payment) {
    payment = state.wallet.payment;
  }

  let balance = 0;
  if (state.wallet) {
    balance = state.wallet.balance || 0;
  }

  return { reference, payment, balance };
}

export default connect(mapStateToProps)(ConfirmPayment);
