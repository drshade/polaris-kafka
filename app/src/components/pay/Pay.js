import React, { Component } from 'react';
import { matchPath } from 'react-router-dom';

import { TextField, InputAdornment, Button } from '@material-ui/core';

import './Pay.css';
import store from '../../store';

import { connect } from 'react-redux';
import { pay } from '../../actions/wallet.pay';
import { push } from 'connected-react-router';

import { generate } from '../../services/reference.service';

class Pay extends Component {
  state = {};

  onChange(key, value) {
    this.setState({ [key]: value });
  }

  pay() {
    let reference = generate();

    let { amount, description } = this.state;
    let personToPay = this.props.personToPay;

    store.dispatch(pay(reference, personToPay, amount, description));
    store.dispatch(push(`/confirm-payment/${reference}`));
  }

  shouldPayBeDisabled() {
    if (!this.state.amount) return true;

    return this.props.balance < this.state.amount;
  }

  render() {
    let p = this.props.personToPay;

    return (
      <div>
        <h4>Pay {p}</h4>
        <div className="disc">
          <span>{p[0]}</span>
        </div>
        <div className="fields">
          <TextField
            type="number"
            label="Enter amount*"
            placeholder="0.00"
            fullWidth
            margin="none"
            InputLabelProps={{
              shrink: true
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <sub className="currency">R</sub>
                </InputAdornment>
              )
            }}
            onChange={(e) => this.onChange('amount', Number(e.target.value))}
          />
          <TextField
            label="Enter description"
            fullWidth
            margin="none"
            InputLabelProps={{
              shrink: true
            }}
            onChange={(e) => this.onChange('description', e.target.value)}
          />
          <div className="button-container keyboard-up">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              onClick={(e) => this.pay()}
              disabled={this.shouldPayBeDisabled()}
            >
              Pay
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  const match = matchPath(state.router.location.pathname, { path: '/pay/:code' });

  const code = match ? match.params.code : '';
  const personToPay = atob(code);

  return {
    code,
    personToPay,
    balance: state.wallet.balance,
    profile: state.user.profile
  };
}

export default connect(mapStateToProps)(Pay);
