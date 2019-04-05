import React, { Component } from 'react';

import { Button, TextField } from '@material-ui/core';

import AmountToAdd from '../amount-to-add/AmountToAdd';
import { deposit } from '../../actions/wallet.deposit.action';

import './CreditCard.css';
import { push } from 'connected-react-router';
import store from '../../store';

import { connect } from 'react-redux';

import { generate } from '../../services/reference.service';

class CreditCard extends Component {
  state = {};

  depositMoney() {
    let reference = generate();
    store.dispatch(deposit(reference, this.props.amountToAdd));
    store.dispatch(push('/'));
  }

  render() {
    return (
      <div>
        <AmountToAdd />
        <h4>Credit Card</h4>
        <form className="card-form" onSubmit={() => this.depositMoney()}>
          <TextField
            type="number"
            required
            inputProps={{ pattern: '[0-9]{16}' }}
            label="Card Number"
            margin="normal"
            className="textFields"
            name="card"
            placeholder="0000000000000000"
          />
          <TextField
            required
            inputProps={{ pattern: '[0-9]{2}/[0-9]{2}' }}
            label="Expiry Date"
            margin="normal"
            name="expDate"
            className="textFieldsSmall"
            placeholder="01/20"
          />
          <TextField
            type="number"
            required
            inputProps={{ pattern: '[0-9]{3}' }}
            label="CVV"
            margin="normal"
            name="cvv"
            className="textFieldsSmall moveRight"
            placeholder="000"
          />
          <div className="button-container keyboard-up">
            <Button variant="contained" color="primary" type="submit">
              Continue
            </Button>
          </div>
        </form>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    amountToAdd: state.wallet.amountToAdd
  };
}

export default connect(mapStateToProps)(CreditCard);
